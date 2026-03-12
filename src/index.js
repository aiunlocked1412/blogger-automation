#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { authenticate, isAuthenticated } from './auth/google-auth.js';
import * as bloggerApi from './blogger/blogger-api.js';
import { generateContent } from './content/ai-generator.js';
import { loadFile } from './content/file-loader.js';
import { optimizeSeo, getSeoScore } from './seo/seo-optimizer.js';
import { searchImages } from './images/image-service.js';
import { buildPostHtml, injectImages } from './utils/html-builder.js';
import { parseScheduleDate, formatScheduleInfo } from './scheduler/scheduler.js';
import logger from './utils/logger.js';

const program = new Command();

program
  .name('blogger')
  .description('Blogger Automation - AI-powered blog posting')
  .version('1.0.0');

// ─── Auth ───
program
  .command('auth')
  .description('Authenticate with Google (OAuth2)')
  .option('--headless', 'Use manual code paste instead of browser')
  .action(async (opts) => {
    const spinner = ora('Authenticating with Google...').start();
    try {
      await authenticate({ headless: opts.headless });
      spinner.succeed(chalk.green('Authentication successful!'));
    } catch (err) {
      spinner.fail(chalk.red(`Authentication failed: ${err.message}`));
      process.exit(1);
    }
  });

// ─── Generate ───
program
  .command('generate <topic>')
  .description('Generate blog content using AI')
  .option('-l, --language <lang>', 'Content language', 'en')
  .option('-w, --words <count>', 'Target word count', '1000')
  .option('--no-seo', 'Skip SEO optimization')
  .action(async (topic, opts) => {
    const spinner = ora(`Generating content about "${topic}"...`).start();
    try {
      let postData = await generateContent(topic, {
        language: opts.language,
        wordCount: parseInt(opts.words),
      });
      spinner.succeed('Content generated');

      if (opts.seo !== false) {
        postData = optimizeSeo(postData);
        const { score, checks } = getSeoScore(postData);
        console.log(chalk.cyan(`\nSEO Score: ${score}/100`));
        for (const check of checks) {
          const icon = check.pass ? chalk.green('✓') : chalk.yellow('✗');
          console.log(`  ${icon} ${check.name}${check.detail ? ` (${check.detail})` : ''}`);
        }
      }

      console.log(chalk.bold(`\nTitle: ${postData.title}`));
      console.log(chalk.dim(`Description: ${postData.metaDescription}`));
      console.log(chalk.dim(`Keywords: ${postData.keywords.join(', ')}`));
      console.log(chalk.dim(`Labels: ${postData.labels.join(', ')}`));
      console.log(chalk.dim(`\nContent preview (first 300 chars):`));
      console.log(postData.content.substring(0, 300) + '...\n');

      // Store in memory for piping to post command
      process.env._LAST_GENERATED = JSON.stringify(postData);
      return postData;
    } catch (err) {
      spinner.fail(chalk.red(`Generation failed: ${err.message}`));
      logger.error(err);
      process.exit(1);
    }
  });

// ─── Post ───
program
  .command('post [source]')
  .description('Create and publish a blog post (file path or topic for AI generation)')
  .option('-d, --draft', 'Save as draft instead of publishing')
  .option('--no-images', 'Skip image search')
  .option('--no-seo', 'Skip SEO optimization')
  .action(async (source, opts) => {
    try {
      // Authenticate
      const spinner = ora('Authenticating...').start();
      const authClient = await authenticate();
      spinner.succeed('Authenticated');

      // Load or generate content
      let postData;
      if (source && (source.endsWith('.md') || source.endsWith('.json'))) {
        const loadSpinner = ora(`Loading ${source}...`).start();
        postData = await loadFile(source);
        loadSpinner.succeed(`Loaded: ${postData.title}`);
      } else if (source) {
        const genSpinner = ora(`Generating content about "${source}"...`).start();
        postData = await generateContent(source);
        genSpinner.succeed('Content generated');
      } else {
        console.log(chalk.red('Please provide a file path or topic'));
        process.exit(1);
      }

      // SEO
      if (opts.seo !== false) {
        postData = optimizeSeo(postData);
      }

      // Images
      let images = [];
      if (opts.images !== false) {
        const imgSpinner = ora('Searching for images...').start();
        const query = postData.keywords?.[0] || postData.title;
        images = await searchImages(query);
        if (images.length) {
          imgSpinner.succeed(`Found ${images.length} images`);
        } else {
          imgSpinner.info('No images found, continuing without');
        }
      }

      // Build HTML
      const buildSpinner = ora('Building HTML...').start();
      let html = buildPostHtml({
        title: postData.title,
        content: postData.content,
        metaDescription: postData.metaDescription,
        keywords: postData.keywords,
        featuredImage: images[0],
      });

      if (images.length > 1) {
        html = injectImages(html, images.slice(1));
      }
      buildSpinner.succeed('HTML built');

      // Publish
      const pubSpinner = ora(opts.draft ? 'Saving draft...' : 'Publishing...').start();
      const result = await bloggerApi.createPost(authClient, {
        title: postData.title,
        content: html,
        labels: postData.labels || [],
        isDraft: opts.draft || false,
      });

      pubSpinner.succeed(
        opts.draft
          ? chalk.green(`Draft saved: ${result.title}`)
          : chalk.green(`Published: ${result.title}`)
      );

      if (result.url) {
        console.log(chalk.cyan(`URL: ${result.url}`));
      }
      console.log(chalk.dim(`Post ID: ${result.id}`));
    } catch (err) {
      console.log(chalk.red(`Error: ${err.message}`));
      logger.error(err);
      process.exit(1);
    }
  });

// ─── Schedule ───
program
  .command('schedule <source>')
  .description('Schedule a blog post for future publishing')
  .option('--date <isoDate>', 'Publish date in ISO 8601 format (required)')
  .option('--no-images', 'Skip image search')
  .option('--no-seo', 'Skip SEO optimization')
  .action(async (source, opts) => {
    if (!opts.date) {
      console.log(chalk.red('--date is required. Example: --date 2026-03-15T09:00:00'));
      process.exit(1);
    }

    try {
      const publishDate = parseScheduleDate(opts.date);
      const scheduleInfo = formatScheduleInfo(publishDate);

      const spinner = ora('Authenticating...').start();
      const authClient = await authenticate();
      spinner.succeed('Authenticated');

      // Load or generate
      let postData;
      if (source.endsWith('.md') || source.endsWith('.json')) {
        postData = await loadFile(source);
      } else {
        const genSpinner = ora(`Generating content about "${source}"...`).start();
        postData = await generateContent(source);
        genSpinner.succeed('Content generated');
      }

      if (opts.seo !== false) postData = optimizeSeo(postData);

      let images = [];
      if (opts.images !== false) {
        images = await searchImages(postData.keywords?.[0] || postData.title);
      }

      let html = buildPostHtml({
        title: postData.title,
        content: postData.content,
        metaDescription: postData.metaDescription,
        keywords: postData.keywords,
        featuredImage: images[0],
      });

      if (images.length > 1) {
        html = injectImages(html, images.slice(1));
      }

      const pubSpinner = ora(`Scheduling for ${scheduleInfo.local}...`).start();
      const result = await bloggerApi.schedulePost(authClient, {
        title: postData.title,
        content: html,
        labels: postData.labels || [],
        publishDate,
      });

      pubSpinner.succeed(chalk.green(`Scheduled: ${result.title}`));
      console.log(chalk.cyan(`Publish date: ${scheduleInfo.local} (${scheduleInfo.relative})`));
      console.log(chalk.dim(`Post ID: ${result.id}`));
    } catch (err) {
      console.log(chalk.red(`Error: ${err.message}`));
      logger.error(err);
      process.exit(1);
    }
  });

// ─── List ───
program
  .command('list')
  .description('List recent blog posts')
  .option('-n, --count <number>', 'Number of posts to show', '10')
  .action(async (opts) => {
    try {
      const spinner = ora('Fetching posts...').start();
      const authClient = await authenticate();
      const posts = await bloggerApi.listPosts(authClient, {
        maxResults: parseInt(opts.count),
      });
      spinner.stop();

      if (!posts.length) {
        console.log(chalk.yellow('No posts found'));
        return;
      }

      console.log(chalk.bold(`\nRecent Posts (${posts.length}):\n`));
      for (const post of posts) {
        const date = new Date(post.published).toLocaleDateString();
        const labels = post.labels?.length ? chalk.dim(` [${post.labels.join(', ')}]`) : '';
        console.log(`  ${chalk.cyan(date)} ${post.title}${labels}`);
        console.log(`  ${chalk.dim(post.url || `ID: ${post.id}`)}\n`);
      }
    } catch (err) {
      console.log(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

// ─── Drafts ───
program
  .command('drafts')
  .description('List draft posts')
  .action(async () => {
    try {
      const spinner = ora('Fetching drafts...').start();
      const authClient = await authenticate();
      const posts = await bloggerApi.listPosts(authClient, { status: ['DRAFT'] });
      spinner.stop();

      if (!posts.length) {
        console.log(chalk.yellow('No drafts found'));
        return;
      }

      console.log(chalk.bold(`\nDrafts (${posts.length}):\n`));
      for (const post of posts) {
        const date = new Date(post.updated).toLocaleDateString();
        console.log(`  ${chalk.cyan(date)} ${post.title}`);
        console.log(`  ${chalk.dim(`ID: ${post.id}`)}\n`);
      }
    } catch (err) {
      console.log(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

program.parse();
