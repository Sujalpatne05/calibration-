# Assets

Drop static files here (the official SANC logo, fonts, etc.).

The SANC logo is currently rendered as an inline SVG component at
`src/components/SancLogo.jsx`. To use the real artwork:

1. Add the file here, e.g. `src/assets/sanc-logo.png`.
2. Import it where the logo is used:
   `import logo from '../assets/sanc-logo.png'`
3. Replace `<SancLogo />` with `<img src={logo} alt="SANC" className="h-16 w-16" />`.
