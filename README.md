# 🎮 Super Pixel: The AdTech Odyssey

An educational 2D platformer that transforms digital advertising concepts into interactive gameplay mechanics. Journey through six worlds of the AdTech ecosystem as "Pixel," a sentient ad creative, to master the tech stack and defeat Emperor GAMA.

## 📖 Story

In the Kingdom of Adville, the sacred **First-Party Data Crystal** has been shattered by **"The Walled Garden"** — a massive fortress controlled by Emperor GAMA (Google-Apple-Meta-Amazon). Without the crystal, messages can't reach their intended audiences, and the ecosystem floods with irrelevant ads.

As Pixel, you must traverse six worlds, collecting **Data Shards** and mastering the **Tech Stack** to rebuild the crystal and restore **Addressability** to the kingdom.

## 🌍 Worlds

### World 1: Inventory Valley
Learn the basics of ad inventory, metrics, and creative formats through canyon navigation and meadow collection.

### World 2: The Tech Stack Towers
Master DSPs, SSPs, DMPs, and Ad Servers in vertical skyscrapers connected by data pipes.

### World 3: Mediums Multimedia
Explore advertising formats from Native to Video, Audio, and Rich Media across shifting visual styles.

### World 4: The Auction Arena
Experience RTB mechanics, auction types, and bidding strategies in a digital colosseum.

### World 5: Identity & Privacy Citadel
Navigate the evolving landscape of cookies, Universal IDs, and privacy regulations.

### World 6: Attribution Castle
Master attribution models and measurement techniques in a temporal palace.

### Final World: The Walled Garden
Face Emperor GAMA in an epic four-phase boss battle representing the major tech platforms.

## 🎯 Core Mechanics

- **Budget Meter**: Your health bar depletes with actions, teaching campaign spend management
- **Viewability Checks**: Platforms only activate when in viewport, teaching viewable impressions
- **Real-Time Bidding**: Mini-games simulating 100-millisecond bid decisions
- **Attribution Windows**: Time-based scoring systems for different attribution models
- **Creative Formats**: Power-ups transforming Pixel from text → image → video ads

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/adtech-odyssey.git
cd adtech-odyssey
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🛠️ Tech Stack

- **Game Engine**: Phaser.js 3.90
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Architecture**: Component-based game systems

## 📁 Project Structure

```
src/
├── components/          # Game systems (Budget, Viewability, Auctions, etc.)
├── entities/            # Game objects and characters
├── scenes/              # Game levels and menus
├── types/               # TypeScript type definitions
├── ui/                  # HUD and interface components
└── main.ts             # Game entry point
```

## 🎓 Educational Value

This game teaches real AdTech concepts through gameplay:
- CPM/CPC/CPA pricing models
- Supply-side vs demand-side platforms
- Cookie deprecation and privacy regulations
- Attribution modeling and measurement
- Auction dynamics and bid optimization
- Creative formats and viewability standards

## 🎮 Controls

- **Arrow Keys / WASD**: Move and jump
- **Space**: Interact/use power-ups
- **F1**: Toggle debug mode
- **Mouse**: UI interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by "The AdTech Book" and real-world digital advertising concepts
- Built with Phaser.js for smooth 2.5D platforming
- Educational game design focused on making complex topics accessible and fun

---

**Ready to master the AdTech ecosystem? Start your odyssey as Pixel!** 🚀
