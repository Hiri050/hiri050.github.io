import type { ArchiveItem, Project } from './types'

/*
 * Every number here comes from a résumé, a README, the source, or a results file
 * in the project itself. Where something is unknown (repo URLs, team size) it is
 * left undefined and marked TODO rather than guessed.
 */

export const projects: Project[] = [
  {
    slug: 'voxel-gpu',
    title: 'Voxel Terrain Engine on a Custom FPGA GPU',
    hook: 'Real places become playable voxel worlds, drawn by a GPU I built in FPGA fabric.',
    date: 'Oct 2026',
    context: 'StormHacks 2026',
    role: 'GPU RTL, ARM game engine, board services and world pipeline',
    tags: ['Verilog', 'C', 'Python', 'Verilator', 'Cyclone V', 'ARM Cortex-A9'],
    visual: 'voxel',
    overview:
      "Pick a place on a map, and its real elevation, land cover, water and climate become a Minecraft-like world. The world is streamed to a DE1-SoC board and played there, rendered by a span GPU running in the board's FPGA.",
    problem:
      "A dual Cortex-A9 can't fill a 640×480 frame with depth testing, fog and transparency at interactive rates. Moving the pixel work into the FPGA meant building a GPU the ARM could feed without cache-coherence bugs, then proving the hardware draws exactly what the software meant.",
    approach: [
      'Split the work at the polygon. The ARM runs game logic, culling and polygon setup and never touches a pixel.',
      'Each frame the ARM writes a command list into DDR, and the FPGA fetches it through the cache-coherent ACP using a page table.',
      'A bit-exact C model of the GPU serves three roles: the PC renderer, the CPU fallback, and the reference the Verilog is checked against.',
    ],
    engineering: [
      {
        title: 'Span GPU',
        body: 'A 40-stage pixel pipeline at 102 MHz that draws one pixel per clock. Each pixel gets a depth test, 1/z from pipelined dividers, its exact world position on the face, block grid lines, fog, per-block shade, water and glass blending, and ordered dithering to RGB332.',
      },
      {
        title: 'Tear-free scan-out',
        body: 'Each 16-row band is drawn on chip and copied out only after the VGA beam has passed it, so 640×480 @ 60 Hz frames never tear.',
      },
      {
        title: 'Game on the ARM',
        body: 'One core handles physics, input, block breaking and placing, and weather. The second core loads chunks and runs greedy meshing (pthreads with CPU affinity). GPU registers, the page table and the framebuffer are mapped through /dev/mem.',
      },
      {
        title: 'World pipeline',
        body: 'Python fetches elevation and land-cover data and classifies it into water, beach, desert, forest and snow line. The world is compressed, CRC-16 checked and sent over a 115200-baud UART to terrad, a systemd daemon that restarts the game with it.',
      },
      {
        title: 'Verification',
        body: 'Verilator runs span_gpu.v against the C model on six camera views and compares the framebuffers byte for byte.',
      },
    ],
    tech: [
      { group: 'Hardware', items: ['Verilog', 'Cyclone V', 'Platform Designer', 'Quartus', 'Verilator'] },
      { group: 'Embedded', items: ['C', 'ARM Cortex-A9', 'Embedded Linux', 'pthreads', '/dev/mem', 'systemd'] },
      { group: 'Pipeline', items: ['Python', 'UART', 'CRC-16'] },
    ],
    results: [
      { value: '102 MHz', label: 'GPU clock, one pixel per clock' },
      { value: '40', label: 'pixel pipeline stages' },
      { value: '640×480', label: 'tear-free VGA at 60 Hz' },
      { value: '6 views', label: 'byte-for-byte match against the C model' },
    ],
    pipeline: {
      title: 'From a map click to a pixel',
      nodes: [
        { label: 'Browser UI', sub: 'pick a place' },
        { label: 'worldgen.py', sub: 'DEM + land cover' },
        { label: 'UART', sub: '115200 · CRC-16' },
        { label: 'terrad', sub: 'systemd daemon' },
        { label: 'mc', sub: 'Cortex-A9 · C' },
        { label: 'Span GPU', sub: 'FPGA · 102 MHz', focus: true },
        { label: 'VGA', sub: '640×480 @ 60' },
      ],
    },
    media: [
      {
        src: '/media/voxel-sunny.png',
        alt: 'Voxel terrain under a clear sky, rendered at 640 by 480 with block grid lines visible on every face.',
        caption: 'Sunny',
        pixelated: true,
      },
      {
        src: '/media/voxel-cloudy.png',
        alt: 'The same hillside under an overcast sky with heavier fog.',
        caption: 'Cloudy',
        pixelated: true,
      },
      {
        src: '/media/voxel-night.png',
        alt: 'The hillside at night, lit dimly under a dark sky.',
        caption: 'Night',
        pixelated: true,
      },
      {
        src: '/media/voxel-rain.png',
        alt: 'A grey rainy scene with rain streaks drawn over the terrain.',
        caption: 'Rain',
        pixelated: true,
      },
    ],
    links: {
      // TODO(Hirdianshu): repository URL
    },
  },
  {
    slug: 'terra-ai',
    title: 'Terra AI',
    hook: 'Ask a 3D terrain a question. Gemini answers by driving the map.',
    date: 'Oct 2026',
    context: 'StormHacks 2026',
    role: 'Front end, Python backend and terrain analysis',
    tags: ['React', 'Three.js', 'TypeScript', 'Python', 'Gemini API'],
    visual: 'terra',
    overview:
      "A 3D explorer for real elevation data. The language model gets tools, not just a chat box: it can switch layers, highlight elevation ranges and extremes, focus on regions and fly the camera.",
    problem:
      "A chat answer about terrain is prose you can't check. I wanted every answer grounded in real DEM data, with the model showing its reasoning on the map itself, and without the API key ever reaching the browser.",
    approach: [
      'The Python backend keeps the Gemini API key server-side and streams replies to the UI.',
      'Function-calling tools map what the model wants to do onto concrete scene actions.',
      'A list of fallback Gemini models keeps the assistant answering when one model is rate-limited.',
    ],
    engineering: [
      {
        title: 'Terrain analysis',
        body: 'Horn slope and aspect, topographic position index, D8 flow accumulation, a minimax flood-level model over a priority queue, and heuristic flood and landslide hazard indices, each rendered as a selectable map layer.',
      },
      {
        title: 'Real data only',
        body: 'Elevation and climate come from Copernicus, Terrarium and Open-Meteo, and place names are geocoded. New areas are fetched on demand and never synthesised.',
      },
      {
        title: 'Front end',
        body: 'React, Three.js and TypeScript, with Zustand for state, built with Vite. The backend proxies /api during development.',
      },
      {
        title: 'Shared pipeline',
        body: 'The same world generator also exports voxel worlds to the FPGA renderer, so one place can be explored in the browser or played on the board.',
      },
    ],
    tech: [
      { group: 'Front end', items: ['React', 'Three.js', 'TypeScript', 'Zustand', 'Vite'] },
      { group: 'Backend', items: ['Python', 'Gemini API', 'Function calling', 'Streaming'] },
      { group: 'Data', items: ['Copernicus DEM', 'Terrarium', 'Open-Meteo', 'NumPy'] },
    ],
    results: [
      { value: '6', label: 'terrain analyses the model can query' },
      { value: '3', label: 'real elevation and climate sources' },
      { value: '0', label: 'API keys shipped to the browser' },
    ],
    pipeline: {
      title: 'How a question becomes a camera move',
      nodes: [
        { label: 'Question', sub: 'natural language' },
        { label: 'Python server', sub: 'key stays here' },
        { label: 'Gemini', sub: 'streamed · tools', focus: true },
        { label: 'Tool call', sub: 'layer · focus · fly' },
        { label: 'Three.js scene', sub: 'real DEM' },
      ],
    },
    links: {
      // TODO(Hirdianshu): repository URL (same repo as the voxel engine?)
    },
  },
  {
    slug: 'volatility',
    title: 'Volatility Forecasting Research Pipeline',
    hook: 'Can machine learning beat a 2009 linear model at forecasting volatility? A study built to answer honestly.',
    date: 'May – Aug 2026',
    context: 'Independent research',
    role: 'Research design, modelling and evaluation',
    tags: ['Python', 'pandas', 'HAR-RV', 'GARCH', 'Gradient boosting', 'Hypothesis testing'],
    visual: 'volatility',
    overview:
      'A walk-forward study of 9 forecasting methods across 20 US large-cap stocks: 521,640 out-of-sample forecasts of 5-day realized variance, from January 2015 to August 2026.',
    problem:
      "Many ML-for-volatility comparisons skip the real benchmark (HAR-RV), score with loss functions that rank models wrongly under a noisy proxy, or never test whether the gap is just noise. Any one of these makes the headline number meaningless.",
    approach: [
      'Target: mean daily realized variance over the next 5 trading days, the quantity a risk-targeting rule actually needs.',
      'Proxy: the Garman–Klass range estimator from daily OHLC, about 2× more accurate than squared close-to-close returns.',
      'Scoring: QLIKE, which stays robust to proxy noise (Patton, 2011). Diebold–Mariano tests with a moving-block bootstrap, Holm-corrected.',
    ],
    engineering: [
      {
        title: 'Walk-forward protocol',
        body: 'An expanding window refit every 63 trading days (46 windows), with a strict target_end < block_start filter between training targets and the test block.',
      },
      {
        title: 'Leakage guard, tested',
        body: 'A unit test proves that the naive filter would leak future targets into training, so the guard exists for a demonstrated reason.',
      },
      {
        title: 'Model zoo',
        body: 'Historical mean, random walks, EWMA, GJR-GARCH(1,1)-t, pooled and per-ticker HAR, HAR-X (leverage and market terms) and gradient-boosted trees, all behind one interface.',
      },
      {
        title: 'Economic check',
        body: 'A volatility-targeting backtest (15% target, 2× leverage cap, 1 bp costs) ranks models by how closely they hit their risk target rather than by Sharpe, which is too noisy to separate them.',
      },
    ],
    tech: [
      { group: 'Modelling', items: ['HAR-RV', 'HAR-X', 'GJR-GARCH', 'EWMA', 'Gradient-boosted trees'] },
      { group: 'Statistics', items: ['QLIKE', 'Diebold–Mariano', 'Block bootstrap', 'Holm correction', 'Mincer–Zarnowitz'] },
      { group: 'Engineering', items: ['Python', 'pandas', 'NumPy', 'pytest', 'yfinance'] },
    ],
    results: [
      { value: '7.1%', label: 'lower QLIKE for HAR-X than HAR' },
      { value: 'p = 0.004', label: 'Diebold–Mariano, Holm-adjusted' },
      { value: '19 / 20', label: 'tickers where HAR-X wins' },
      { value: '521,640', label: 'out-of-sample forecasts' },
    ],
    resultsNote:
      'One caveat I report rather than hide: much of the cumulative edge arrives in the March 2020 volatility spike. The 19/20 per-ticker win rate is the stronger evidence that the effect is broad. Gradient-boosted trees did not significantly beat HAR (p = 0.66), and in the synthetic-data run the LSTM and Transformer models were both significantly worse than HAR (Holm-adjusted p ≤ 0.01).',
    chart: {
      title: 'QLIKE loss by model',
      caption: 'Out-of-sample, 20 tickers, 5-day horizon. Lower is better.',
      unit: 'QLIKE',
      lowerIsBetter: true,
      data: [
        { label: 'HAR-X', value: 0.1764, highlight: true },
        { label: 'HAR (pooled)', value: 0.19, baseline: true },
        { label: 'Gradient boosting', value: 0.1913 },
        { label: 'HAR (per ticker)', value: 0.1916 },
        { label: 'RW(22)', value: 0.2345 },
        { label: 'EWMA(0.94)', value: 0.2369 },
        { label: 'GJR-GARCH(1,1)-t', value: 0.2423 },
        { label: 'RW(1)', value: 0.3376 },
        { label: 'Historical mean', value: 0.4198 },
      ],
    },
    pipeline: {
      title: 'Study design',
      nodes: [
        { label: 'Daily OHLC', sub: '20 equities' },
        { label: 'Garman–Klass', sub: 'realized variance' },
        { label: 'Walk-forward', sub: '46 windows', focus: true },
        { label: '9 models', sub: 'HAR · GARCH · GBM' },
        { label: 'QLIKE + DM', sub: 'Holm-corrected' },
        { label: 'Backtest', sub: 'vol targeting' },
      ],
    },
    media: [
      {
        src: '/media/fig6_cumulative_loss_differential.png',
        alt: 'Cumulative loss differential of each model against pooled HAR from 2015 to 2026. HAR-X rises above zero, with a large step in early 2020. Every other model drifts below zero.',
        caption: 'Cumulative loss differential against pooled HAR. Rising means winning, and a single cliff means one lucky episode.',
        paper: true,
      },
    ],
    links: {
      // TODO(Hirdianshu): repository URL
    },
  },
  {
    slug: 'arc4',
    title: 'ARC4 Stream Cipher Cracker',
    hook: '128 parallel cores search a 24-bit ARC4 keyspace in under three seconds.',
    date: 'Jan – Apr 2026',
    role: 'Architecture and RTL',
    tags: ['SystemVerilog', 'Cyclone V', 'Quartus', 'ALTPLL'],
    visual: 'arc4',
    overview:
      'A brute-force ARC4 cryptanalysis engine on a Cyclone V FPGA that recovers the key for a ciphertext by searching all 16.7 million keys of a 24-bit keyspace in parallel.',
    problem:
      'On an FPGA, the cost of one wrong key is multiplied by millions. Throughput depends on both how many cores fit on the device and how quickly each core gives up on a bad key.',
    approach: [
      'Replicate a search core 128 times through parametric generate instantiation, each core taking a slice of the keyspace.',
      'Reject wrong keys as early as possible with inline ASCII validation of the decrypted stream.',
      'Remove per-core memories that were only there for convenience, so more cores fit on the device.',
    ],
    engineering: [
      {
        title: 'Early-abort PRGA',
        body: 'The per-core FSM validates each decrypted byte as ASCII while it is generated and stops at the first failure. Cycles per wrong key dropped from about 630 to about 14.',
      },
      {
        title: 'Area',
        body: 'Removing 128 private plaintext memory blocks cut device utilisation from 97% to 65%.',
      },
      {
        title: 'Clocking',
        body: 'ALTPLL IP raises the clock from 50 to 70 MHz.',
      },
      {
        title: 'Instrumentation',
        body: 'A custom MBOX mailbox protocol (ISMCE-accessible) handles automated evaluator I/O, and a 32-bit on-chip cycle counter makes benchmarks reproducible.',
      },
    ],
    tech: [
      { group: 'RTL', items: ['SystemVerilog', 'FSM design', 'generate blocks'] },
      { group: 'Tools', items: ['Quartus', 'ALTPLL', 'ModelSim', 'DE1-SoC'] },
    ],
    results: [
      { value: '5.74M', label: 'keys per second' },
      { value: '~45×', label: 'fewer cycles per wrong key' },
      { value: '97→65%', label: 'device utilisation' },
      { value: '< 3 s', label: 'to search the full 24-bit keyspace' },
    ],
    pipeline: {
      title: 'One search core (× 128)',
      nodes: [
        { label: 'Key slice', sub: '24-bit space / 128' },
        { label: 'KSA', sub: 'key scheduling' },
        { label: 'PRGA', sub: 'early abort', focus: true },
        { label: 'ASCII check', sub: 'inline' },
        { label: 'MBOX', sub: 'report key' },
      ],
    },
    links: {
      // TODO(Hirdianshu): repository URL (if course rules allow it to be public)
    },
  },
  {
    slug: 'f1tenth',
    title: 'F1TENTH Autonomous Racing',
    hook: 'Overtaking on a 1/10-scale autonomous race car, with a safety layer that does not trust the planner.',
    date: 'Sept – Dec 2025',
    role: 'Control and perception',
    tags: ['ROS2', 'Python', 'LiDAR', 'OpenCV', 'MPCC'],
    visual: 'f1tenth',
    overview:
      'A motion-control and perception stack for real-time overtaking on a 1/10-scale autonomous race car, fusing LiDAR point clouds with monocular vision.',
    problem:
      'Overtaking means trading speed against tracking error under real-time latency limits, while never relying on the planner alone to keep the car safe.',
    approach: [
      'Model Predictive Contouring Control (MPCC) plans the racing line and overtakes in real time.',
      'LiDAR and monocular vision run together for obstacle detection and path tracking.',
      'Time-to-collision (TTC) braking sits underneath the planner as an independent fail-safe.',
    ],
    engineering: [
      {
        title: 'Controller tuning',
        body: 'Cost-function weights were tuned iteratively to balance speed against tracking error under real-time latency constraints.',
      },
      {
        title: 'Perception',
        body: 'A LiDAR obstacle detector and an OpenCV vision pipeline feed the environment state to the motion planner.',
      },
      {
        title: 'Reproducibility',
        body: 'Structured telemetry logging made experiments repeatable and supported regression testing of controller parameters across track configurations.',
      },
    ],
    tech: [
      { group: 'Robotics', items: ['ROS2', 'MPCC', 'TTC safety', 'Ackermann control'] },
      { group: 'Perception', items: ['LiDAR', 'Point clouds', 'OpenCV', 'Sensor fusion'] },
      { group: 'Language', items: ['Python'] },
    ],
    results: [
      { value: 'MPCC', label: 'real-time overtaking controller' },
      { value: 'TTC', label: 'independent fail-safe braking' },
      { value: '1/10', label: 'scale car on real tracks' },
    ],
    pipeline: {
      title: 'Control loop',
      nodes: [
        { label: 'LiDAR + camera', sub: 'sensing' },
        { label: 'Obstacle detection', sub: 'fusion' },
        { label: 'MPCC', sub: 'planning', focus: true },
        { label: 'TTC guard', sub: 'fail-safe' },
        { label: 'Ackermann drive', sub: 'actuation' },
      ],
    },
    links: {
      // TODO(Hirdianshu): repository URL or demo video
    },
  },
  {
    slug: 'chess-ai',
    title: 'Chess AI Platform',
    hook: 'A learned evaluator against classical search, measured rather than assumed.',
    date: 'Jan – Apr 2026',
    role: 'ML, engine and multiplayer backend',
    tags: ['Python', 'PyTorch', 'TypeScript', 'Express', 'Socket.io'],
    visual: 'chess',
    overview:
      'A chess platform where a neural evaluator and classical minimax heuristics plug into the same alpha-beta engine, with real-time two-player games on top.',
    problem:
      "\"The neural net plays better\" is easy to say and hard to show. The two evaluators needed to be swappable inside one engine so they could be compared directly.",
    approach: [
      'Label 50,000 positions with Stockfish and train a feedforward network on 70-dimensional engineered board features.',
      'Integrate both evaluators as interchangeable modules in a shared alpha-beta engine.',
      'Compare them in a controlled study across 500+ test positions as search depth varies.',
    ],
    engineering: [
      {
        title: 'Model',
        body: 'A feedforward network shaped by Transformer-informed design principles. I tuned learning rate, dropout and batch size, and read R² and loss curves to tell underfitting from overfitting.',
      },
      {
        title: 'Engine',
        body: 'Minimax with alpha-beta pruning, with the ML model and the classical heuristic as interchangeable evaluators.',
      },
      {
        title: 'Multiplayer',
        body: 'Socket.io rooms with matchmaking, server-side move validation and disconnect recovery, over a TypeScript/Express REST API with persistent game state.',
      },
    ],
    tech: [
      { group: 'ML', items: ['Python', 'PyTorch', 'Feature engineering', 'Stockfish labels'] },
      { group: 'Platform', items: ['TypeScript', 'Express', 'Socket.io', 'REST'] },
    ],
    results: [
      { value: '50,000', label: 'Stockfish-labelled positions' },
      { value: '70-d', label: 'engineered feature vectors' },
      { value: '500+', label: 'positions in the evaluation study' },
    ],
    links: {
      // TODO(Hirdianshu): repository URL
    },
  },
  {
    slug: 'finance-assistant',
    title: 'AI Financial Assistant & Messenger',
    hook: 'A real-time messenger with a multimodal market analyst built in.',
    date: 'Jan – Apr 2026',
    context: 'Top 3 of 37 groups',
    role: 'Messaging backend and AI services',
    tags: ['Node.js', 'MongoDB', 'WebSockets', 'Flask', 'Llama3', 'LLaVA', 'Whisper'],
    visual: 'finance',
    overview:
      'A multi-room chat application with an AI panel that answers market questions from text, voice, or a screenshot of a chart.',
    problem:
      'Stock conversations happen in chat, but the useful context lives elsewhere: live prices, chart patterns, a question asked out loud. The goal was to bring all of it into the conversation.',
    approach: [
      'Node.js, Express and MongoDB with a WebSocket broker for real-time rooms and session-based auth.',
      'A Python Flask AI server exposing six REST endpoints for language, vision and speech models.',
      'A context-aware sidebar that reads the live chat and refreshes recommendations every 30 seconds.',
    ],
    engineering: [
      {
        title: 'Chart reading',
        body: 'LLaVA identifies candlestick patterns, trend direction and support and resistance levels in uploaded chart screenshots.',
      },
      {
        title: 'Voice',
        body: 'Whisper transcription enables hands-free stock queries, and voice and chart can be combined in one question.',
      },
      {
        title: 'Live data',
        body: 'The Alpha Vantage API answers live stock price lookups.',
      },
      {
        title: 'Recommendations',
        body: 'A Llama3 sidebar reads the chat context and refreshes its suggestions every 30 seconds.',
      },
    ],
    tech: [
      { group: 'Realtime', items: ['Node.js', 'Express', 'MongoDB', 'WebSockets'] },
      { group: 'AI', items: ['Python', 'Flask', 'Llama3', 'LLaVA', 'Whisper'] },
      { group: 'Data', items: ['Alpha Vantage'] },
    ],
    results: [
      { value: 'Top 3', label: 'of 37 groups, recognised for innovation and technical depth' },
      { value: '6', label: 'REST inference endpoints' },
      { value: '3', label: 'input modes: text, voice, chart image' },
    ],
    links: {
      // TODO(Hirdianshu): repository URL
    },
  },
  {
    slug: 'baccarat',
    title: 'FPGA Baccarat Engine',
    hook: 'A card game in hardware, with the scorer tested exhaustively.',
    date: 'Jan – Feb 2026',
    role: 'Design and verification',
    tags: ['SystemVerilog', 'Quartus', 'ModelSim', 'DE1-SoC'],
    visual: 'baccarat',
    overview:
      'A baccarat engine built as a datapath controlled by a finite state machine, running on a DE1-SoC with its HEX displays and LEDs.',
    problem:
      'The third-card rules have many branches, and a hardware bug is costly to find on the board. Every scoring case needed to be covered before synthesis.',
    approach: [
      'Separate control (the FSM) from data (scores and cards) so each can be tested on its own.',
      'Test the scorer exhaustively instead of sampling it.',
      'Confirm behaviour on the physical board after simulation.',
    ],
    engineering: [
      {
        title: 'Datapath and FSM',
        body: 'Mod-10 hand scoring, natural detection, and the standard player and banker third-card rules.',
      },
      {
        title: 'Board I/O',
        body: 'A seven-segment driver and board wrapper map cards, running totals and winner lights onto the HEX displays and LEDs, stepped by debounced key presses.',
      },
      {
        title: 'Verification',
        body: 'Self-checking testbenches with $fatal assertions cover the scorer across all 2,744 card combinations, plus FSM, datapath and top-level checks.',
      },
    ],
    tech: [
      { group: 'RTL', items: ['SystemVerilog', 'FSM + datapath'] },
      { group: 'Tools', items: ['Quartus', 'ModelSim', 'DE1-SoC'] },
    ],
    results: [
      { value: '2,744', label: 'card combinations checked exhaustively' },
      { value: 'On board', label: 'synthesised and verified on a DE1-SoC' },
    ],
    links: {},
  },
]

export const archive: ArchiveItem[] = [
  {
    title: 'Parameterizable FIFO + SVAs',
    date: 'Jun – Jul 2025',
    tags: ['SystemVerilog', 'Formal'],
    summary:
      'A synchronous FIFO with full and empty flags. SVAs exclude overflow and underflow, and a seeded, randomized, self-checking testbench reports the first failure.',
  },
  {
    title: 'Investment Management DB',
    date: 'Oct 2025 – Present',
    tags: ['SQL', 'Schema design'],
    summary:
      'A normalized schema for funds, portfolios, instruments, trades and positions, with views for holdings, trade audit, P/L and compliance flags.',
  },
  {
    title: 'Stock Portfolio Tracker',
    date: 'Mar 2026 – Present',
    tags: ['Python', 'ML'],
    summary: 'A portfolio dashboard for positions, P/L and sector allocation, with return-prediction models in design.',
    status: 'in-progress',
  },
  {
    title: 'FPGA Dice Roller',
    date: 'Sept – Dec 2023',
    tags: ['Verilog', 'DE1-SoC'],
    summary: 'An FSM dice roller with input debouncing and clock prescaling. Simulated in ModelSim and brought up on the board.',
  },
]

export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug)
