import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        await page.set_viewport_size({"width": 1280, "height": 800})
        
        assets_dir = 'ui/assets'
        os.makedirs(assets_dir, exist_ok=True)
        
        # We need to wait for particles or transitions to settle
        
        print("Capturing login page...")
        await page.goto('http://localhost:5000/login.html')
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{assets_dir}/login_screenshot.png")
        
        print("Capturing credentials page...")
        await page.goto('http://localhost:5000/credentials.html')
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{assets_dir}/credentials_screenshot.png")
        
        print("Capturing upload page...")
        await page.goto('http://localhost:5000/upload.html')
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{assets_dir}/upload_screenshot.png")
        
        print("Capturing jobs page...")
        await page.goto('http://localhost:5000/jobs.html')
        await page.wait_for_timeout(2000) # Jobs might take a little longer to render table layout
        await page.screenshot(path=f"{assets_dir}/jobs_screenshot.png")
        
        await browser.close()
        print("Done!")

if __name__ == '__main__':
    asyncio.run(main())
