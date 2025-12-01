#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import clipboard from 'clipboardy';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Import lib functions
import { parseMarkdownFile } from './lib/parser.js';
import { generateSummaries } from './lib/summary.js';
import { buildCanonicalUrl } from './lib/utils.js';
import { postToDevTo } from './lib/platforms/devto.js';
import { postToMedium } from './lib/platforms/medium.js';
import { postToLinkedIn } from './lib/platforms/linkedin.js';
import { generateTwitterText } from './lib/platforms/twitter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('cross-post')
  .description('Cross-post blog articles to multiple platforms')
  .option('-f, --file <path>', 'Path to markdown file')
  .option('-p, --platforms <platforms>', 'Comma-separated list of platforms (devto,medium,linkedin,twitter)', 'devto,medium,linkedin')
  .option('-d, --dry-run', 'Preview without posting')
  .option('-y, --yes', 'Skip confirmation prompt')
  .parse(process.argv);

const options = program.opts();

async function main() {
  console.log(chalk.bold.cyan('\n🚀 Cross-Post Blog Article\n'));
  console.log(chalk.gray('─'.repeat(50)));

  // Determine file path
  let filePath = options.file;
  if (!filePath) {
    console.error(chalk.red('Error: --file parameter is required'));
    console.log(chalk.yellow('\nUsage: npm run cross-post -- --file "public/blog-posts/your-post.md"'));
    process.exit(1);
  }

  // Resolve full path
  filePath = path.resolve(process.cwd(), filePath);

  // Parse markdown file
  const spinner = ora('Parsing markdown file...').start();
  let articleData;
  try {
    const parsed = await parseMarkdownFile(filePath);
    const canonicalUrl = buildCanonicalUrl(filePath, process.env.SITE_URL || 'https://techwithdikshant.com');

    articleData = {
      ...parsed,
      canonicalUrl,
      filename: path.basename(filePath)
    };

    spinner.succeed('Markdown file parsed');
  } catch (error) {
    spinner.fail('Failed to parse markdown');
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Display article info
  console.log(chalk.bold(`\n📄 Article: ${articleData.frontmatter.title}`));
  console.log(chalk.gray(`📅 Date: ${articleData.frontmatter.date}`));
  console.log(chalk.gray(`🏷️  Tags: ${articleData.frontmatter.tags.join(', ')}`));
  console.log(chalk.gray(`🔗 Canonical: ${articleData.canonicalUrl}`));

  // Generate summaries
  const summaries = generateSummaries(
    articleData.content,
    articleData.frontmatter,
    articleData.canonicalUrl
  );

  // Show preview
  console.log(chalk.bold('\n📝 Summary Preview:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(summaries.generic.substring(0, 200) + '...');
  console.log(chalk.gray('─'.repeat(50)));

  // Parse platforms
  const selectedPlatforms = options.platforms.split(',').map(p => p.trim().toLowerCase());

  // Confirmation
  if (!options.yes && !options.dryRun) {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Post to ${selectedPlatforms.join(', ')}?`,
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('\nCancelled.'));
      process.exit(0);
    }
  }

  if (options.dryRun) {
    console.log(chalk.yellow('\n🔍 DRY RUN - No actual posting will occur\n'));
  }

  const results = [];

  // Post to Dev.to
  if (selectedPlatforms.includes('devto')) {
    const devtoSpinner = ora('Posting to Dev.to...').start();
    try {
      if (!options.dryRun) {
        const result = await postToDevTo(
          articleData,
          process.env.DEVTO_API_KEY,
          process.env.SITE_URL || 'https://techwithdikshant.com'
        );
        results.push(result);
        devtoSpinner.succeed(chalk.green(`Posted to Dev.to: ${result.url}`));
      } else {
        devtoSpinner.succeed(chalk.gray('Would post to Dev.to'));
      }
    } catch (error) {
      devtoSpinner.fail(chalk.red(`Failed to post to Dev.to: ${error.message}`));
    }
  }

  // Post to Medium
  if (selectedPlatforms.includes('medium')) {
    const mediumSpinner = ora('Posting to Medium...').start();
    try {
      if (!options.dryRun) {
        const result = await postToMedium(
          articleData,
          process.env.MEDIUM_TOKEN,
          process.env.SITE_URL || 'https://techwithdikshant.com'
        );
        results.push(result);
        mediumSpinner.succeed(chalk.green(`Posted to Medium: ${result.url}`));
      } else {
        mediumSpinner.succeed(chalk.gray('Would post to Medium'));
      }
    } catch (error) {
      mediumSpinner.fail(chalk.red(`Failed to post to Medium: ${error.message}`));
    }
  }

  // Post to LinkedIn
  if (selectedPlatforms.includes('linkedin')) {
    const linkedinSpinner = ora('Posting to LinkedIn...').start();
    try {
      if (!options.dryRun) {
        const result = await postToLinkedIn(
          articleData,
          process.env.LINKEDIN_ACCESS_TOKEN,
          process.env.LINKEDIN_PERSON_URN,
          summaries
        );
        results.push(result);
        linkedinSpinner.succeed(chalk.green(`Posted to LinkedIn: ${result.url}`));
      } else {
        linkedinSpinner.succeed(chalk.gray('Would post to LinkedIn'));
      }
    } catch (error) {
      linkedinSpinner.fail(chalk.red(`Failed to post to LinkedIn: ${error.message}`));
    }
  }

  // Generate Twitter text
  if (selectedPlatforms.includes('twitter')) {
    console.log(chalk.bold('\n🐦 Twitter/X'));
    const twitterData = generateTwitterText(articleData, summaries);

    console.log(chalk.gray('─'.repeat(50)));
    console.log(twitterData.text);
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`Length: ${twitterData.length}/280 characters`));

    if (!options.dryRun) {
      try {
        await clipboard.write(twitterData.text);
        console.log(chalk.green('✂️  Copied to clipboard!'));
        console.log(chalk.cyan('📋 Paste at: https://twitter.com/compose/tweet'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not copy to clipboard. Please copy manually.'));
      }
    }
  }

  // Summary
  console.log(chalk.bold.green('\n✨ Cross-Posting Complete!\n'));

  if (results.length > 0) {
    console.log(chalk.bold('📊 Results:'));
    results.forEach(result => {
      console.log(chalk.green(`✅ ${result.platform}: ${result.url}`));
    });
  }

  console.log(chalk.gray('\n🎉 Done! Your article is now live on multiple platforms.\n'));
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  process.exit(1);
});
