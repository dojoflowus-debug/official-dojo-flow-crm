#!/bin/bash
# Auto-answer drizzle-kit migration prompts with "create column"
# This script sends Enter key repeatedly to select the default option

cd /home/ubuntu/dojoflow

# Send 50 Enter keys to handle all prompts
yes '' | head -n 50 | pnpm db:push
