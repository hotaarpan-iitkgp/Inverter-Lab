# PowerSim - Interactive Inverter Visualizer

An interactive power electronics inverter simulation tool featuring real-time circuit schematic conduction animation, PWM modulation schemes, and synchronized multi-channel oscilloscope waveforms.

## Features

- **Topologies**: Single-Phase Half-Bridge, Single-Phase Full-Bridge, and Three-Phase Inverter.
- **Control & Modulation**: 180° Conduction, 120° Conduction, Sinusoidal PWM (SPWM), Bipolar PWM, and Unipolar PWM.
- **Circuit Dynamics**: Real-time current flow animations, gate pulse indication with complete MOSFET glowing, anti-parallel freewheeling diode modeling, and inductive/capacitive reactive load transients.
- **Oscilloscope**: Multi-channel synchronized waveforms for gate signals, line/phase voltages, and phase currents with real-time interactive time scrubber.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

## GitHub Pages Deployment with GitHub Actions

This repository is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) to automatically build and deploy the app to GitHub Pages on every push.

### Enabling GitHub Pages:

1. Push this repository to your GitHub account.
2. In your GitHub repository, navigate to **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions**.
4. That's it! Pushing to `main` or `master` will trigger the workflow and publish your site at:
   ```
   https://<your-username>.github.io/<your-repository-name>/
   ```
5. You can also manually trigger a deployment at any time from the **Actions** tab by selecting **Deploy to GitHub Pages** > **Run workflow**.
