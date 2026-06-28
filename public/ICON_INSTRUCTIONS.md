# PWA Icon Instructions

You need to create the following icon files and place them in the `/public` folder:

## Required Icons:

1. **pwa-192x192.png** - 192x192 pixels
   - Standard PWA icon for Android home screen
   - Should have your SANC logo centered

2. **pwa-512x512.png** - 512x512 pixels
   - High resolution PWA icon
   - Should have your SANC logo centered

3. **pwa-180x180.png** - 180x180 pixels
   - Apple touch icon for iOS home screen
   - Should have your SANC logo centered

## How to Create:

### Option 1: Use an online tool
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your SANC_LOGO_-_Black.png
3. Download the generated icons
4. Rename them as specified above

### Option 2: Use image editing software
1. Open your SANC_LOGO_-_Black.png in Photoshop/GIMP
2. Create new images with the sizes above
3. Add a background color (#0d87eb blue or white)
4. Center your logo
5. Export as PNG

### Option 3: Use ImageMagick (command line)
```bash
# Install ImageMagick first, then:
convert SANC_LOGO_-_Black.png -resize 192x192 -background white -gravity center -extent 192x192 pwa-192x192.png
convert SANC_LOGO_-_Black.png -resize 512x512 -background white -gravity center -extent 512x512 pwa-512x512.png
convert SANC_LOGO_-_Black.png -resize 180x180 -background white -gravity center -extent 180x180 pwa-180x180.png
```

## Design Tips:
- Use a solid background color (white or brand blue #0d87eb)
- Make sure the logo is clearly visible
- Test on both light and dark themes
- Icons should work as both regular and maskable
