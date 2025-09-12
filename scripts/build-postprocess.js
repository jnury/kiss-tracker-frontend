#!/usr/bin/env node

// Post-process the built HTML to replace localhost URLs with production URLs
const fs = require('fs')
const path = require('path')

const htmlFile = path.join(__dirname, '../dist/index.html')
const frontendUrl = process.env.VITE_FRONTEND_URL || 'http://localhost:3000'

if (fs.existsSync(htmlFile)) {
  let html = fs.readFileSync(htmlFile, 'utf8')
  
  // Only replace localhost URLs if we have a different production URL
  if (frontendUrl !== 'http://localhost:3000') {
    html = html.replace(/http:\/\/localhost:3000/g, frontendUrl)
    console.log(`✅ Replaced localhost URLs in index.html with: ${frontendUrl}`)
  } else {
    console.log(`✅ No URL replacement needed (using localhost)`)
  }
  
  fs.writeFileSync(htmlFile, html)
} else {
  console.log('❌ dist/index.html not found')
}