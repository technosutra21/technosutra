# 🏛️ Techno Sutra AR

An immersive AR (Augmented Reality) experience showcasing the 56 chapters of the Avatamsaka Sutra through interactive 3D models.

## 🌟 Features

- **WebXR Compatibility**: Supports modern AR browsers and devices
- **Cross-Platform**: Works on iOS (AR Quick Look), Android (Scene Viewer), and WebXR-enabled browsers
- **Interactive Gallery**: Browse through all 56 spiritual teachers from the sutra
- **Offline Support**: Progressive Web App with service worker caching
- **Multi-Language**: Currently in Portuguese, easily extensible
- **Character Database**: Comprehensive information about each spiritual figure
- **Security-First**: Content Security Policy and input validation

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Safari, Firefox)
- HTTPS-enabled web server (required for AR features)
- Node.js (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/technosutra.git
   cd technosutra
   ```

2. **Serve locally with HTTPS**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000 -S
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Access the application**
   - Gallery: `https://localhost:8000/galeria.html`
   - AR Viewer: `https://localhost:8000/index.html?model=1`

## 📱 Device Support

### ✅ Fully Supported
- **iOS 12+**: Safari with AR Quick Look
- **Android 7+**: Chrome with Scene Viewer
- **Desktop**: Chrome/Edge with WebXR

### ⚠️ Limited Support
- Firefox (3D viewing only, no AR)
- Older devices (fallback to 3D models)

## 🏗️ Project Structure

```
technosutra/
├── index.html              # Main AR viewer
├── galeria.html            # Gallery of all models
├── sw.js                   # Service worker for offline support
├── config.json             # Centralized configuration
├── models/
│   ├── modelo1.glb         # 3D models (GLB format)
│   ├── modelo2.glb
│   └── ...
├── characters/             # Character data processing
│   ├── character_processor.py
│   ├── *.txt              # Character profiles
│   └── resultados_otimizados/
├── chapters/              # Sutra chapter texts
├── qr_codes/             # QR code generation
└── summaries/            # Content summaries
```

## 🎯 Usage

### Viewing Individual Models

Navigate to a specific model:
```
https://your-domain.com/index.html?model=3
```

Parameters:
- `model`: Chapter number (1-56)

### Gallery View

Browse all available models at:
```
https://your-domain.com/galeria.html
```

Features:
- Filter by availability, type, or stage
- Search by name, occupation, or location
- Progressive model detection

### AR Activation

1. **Mobile**: Tap the "Ver em AR" button
2. **Point camera** at a flat surface
3. **Tap to place** the 3D model
4. **Interact** using gestures

## 🛠️ Development

### Adding New Models

1. **Prepare 3D model** in GLB format
2. **Name file** as `modelo[NUMBER].glb`
3. **Update character data** in `/characters/`
4. **Test model** detection

### Character Data Processing

```bash
# Process all character files
python characters/character_processor.py

# Generate Wix-compatible export
python characters/wix_integration.py
```

### Configuration

Edit `config.json` for:
- AR settings (scale, camera orbit)
- UI theme colors
- Cache durations
- API endpoints

## 🔒 Security Features

- **Content Security Policy**: Prevents XSS attacks
- **Input Validation**: Sanitizes model parameters
- **HTTPS Required**: Ensures secure AR features
- **Rate Limiting**: Protects against abuse

## 📊 Performance

### Optimizations
- **Model Caching**: Service worker pre-caches available models
- **Batch Detection**: Efficient model availability checking
- **Progressive Loading**: Models load as needed
- **Compression**: GLB models optimized for web

### Monitoring
- **Detection Cache**: 24-hour model availability cache
- **Error Logging**: Comprehensive error tracking
- **Performance Metrics**: Load time monitoring

## 🔌 Integrations

### Wix CMS
Export character data to Wix:
```bash
python characters/wix_integration.py
```

### External APIs
- Model-viewer library (Google)
- WebXR specifications
- Service Worker APIs

## 🐛 Troubleshooting

### Common Issues

**AR not working on mobile**
- Ensure HTTPS is enabled
- Check device compatibility
- Update browser to latest version

**Models not loading**
- Verify GLB file exists
- Check console for errors
- Clear browser cache

**Performance issues**
- Reduce model complexity
- Check network connection
- Monitor device capabilities

### Debug Mode
Triple-tap the screen to show debug information in console.

## 📝 Character Data Format

Characters follow a structured format:

```json
{
  "name": "Manjushri",
  "title": "Senhor da Sabedoria",
  "occupation": "Bodhisattva",
  "location": "Sumanāmukha",
  "chapter": 55,
  "description": "Bodhisattva da sabedoria...",
  "spiritual_characteristics": [...],
  "mystical_experience": "...",
  "symbolism": "..."
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Enable HTTPS
- [ ] Configure CSP headers
- [ ] Optimize GLB files
- [ ] Set up monitoring
- [ ] Test cross-platform
- [ ] Update cache settings

### Recommended Hosting
- **Netlify**: Easy deployment with HTTPS
- **Vercel**: Optimized for static sites
- **GitHub Pages**: Free hosting (with custom domain for HTTPS)

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** across devices
5. **Submit** a pull request

### Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure cross-platform compatibility

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Avatamsaka Sutra** traditional texts and translations
- **Model-viewer** library by Google
- **WebXR** community and standards
- **Buddhist scholarship** and digital preservation efforts

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/technosutra/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/technosutra/discussions)
- **Email**: support@technosutra.com

## 🔄 Version History

### v1.2.0 (Current)
- Enhanced security with CSP
- Improved AR device detection
- Optimized model caching
- Added comprehensive error handling

### v1.1.0
- Added gallery view
- Implemented character database
- Enhanced mobile support

### v1.0.0
- Initial AR implementation
- Basic model loading
- WebXR integration

---

*Experience the wisdom of the Avatamsaka Sutra in augmented reality* ✨
