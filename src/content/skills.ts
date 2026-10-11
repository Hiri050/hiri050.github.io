import type { Skill, SkillGroup, SystemNode } from './types'

export const skillGroups: SkillGroup[] = [
  { id: 'hardware', label: 'Hardware', blurb: 'RTL, FPGAs and verification' },
  { id: 'systems', label: 'Systems', blurb: 'Embedded Linux and low-level C' },
  { id: 'software', label: 'Software', blurb: 'Services, APIs and interfaces' },
  { id: 'robotics', label: 'Robotics', blurb: 'Perception, planning and control' },
  { id: 'ai', label: 'AI', blurb: 'Training models and putting them to work' },
  { id: 'quant', label: 'Data & Quant', blurb: 'Statistics that hold up' },
]

/** Only skills that appear in a project or role on this site. */
export const skills: Skill[] = [
  // Hardware
  { name: 'Verilog', groups: ['hardware'], usedIn: ['voxel-gpu'] },
  { name: 'SystemVerilog', groups: ['hardware'], usedIn: ['arc4', 'baccarat'] },
  { name: 'Quartus', groups: ['hardware'], usedIn: ['arc4', 'baccarat', 'voxel-gpu'] },
  { name: 'Verilator', groups: ['hardware'], usedIn: ['voxel-gpu'] },
  { name: 'ModelSim', groups: ['hardware'], usedIn: ['baccarat'] },
  { name: 'Cyclone V', groups: ['hardware'], usedIn: ['voxel-gpu', 'arc4'] },
  { name: 'FSM design', groups: ['hardware'], usedIn: ['arc4', 'baccarat'] },
  { name: 'ALTPLL', groups: ['hardware'], usedIn: ['arc4'] },
  // Systems
  { name: 'C', groups: ['systems', 'hardware'], usedIn: ['voxel-gpu'] },
  { name: 'ARM Cortex-A9', groups: ['systems', 'hardware'], usedIn: ['voxel-gpu'] },
  { name: 'Embedded Linux', groups: ['systems'], usedIn: ['voxel-gpu'] },
  { name: 'pthreads', groups: ['systems'], usedIn: ['voxel-gpu'] },
  { name: 'UART / CRC', groups: ['systems'], usedIn: ['voxel-gpu'] },
  { name: 'systemd', groups: ['systems'], usedIn: ['voxel-gpu'] },
  { name: 'Linux', groups: ['systems'], usedIn: ['voxel-gpu', 'f1tenth'] },
  { name: 'Git', groups: ['systems', 'software'], usedIn: [] },
  // Software
  { name: 'TypeScript', groups: ['software'], usedIn: ['terra-ai', 'chess-ai'] },
  { name: 'React', groups: ['software'], usedIn: ['terra-ai'] },
  { name: 'Three.js', groups: ['software'], usedIn: ['terra-ai'] },
  { name: 'Node.js', groups: ['software'], usedIn: ['finance-assistant'] },
  { name: 'Express', groups: ['software'], usedIn: ['chess-ai', 'finance-assistant'] },
  { name: 'WebSockets', groups: ['software'], usedIn: ['finance-assistant', 'chess-ai'] },
  { name: 'MongoDB', groups: ['software'], usedIn: ['finance-assistant'] },
  { name: 'SQL', groups: ['software', 'quant'], usedIn: [] },
  { name: 'Flask', groups: ['software', 'ai'], usedIn: ['finance-assistant'] },
  // Robotics
  { name: 'ROS2', groups: ['robotics'], usedIn: ['f1tenth'] },
  { name: 'LiDAR', groups: ['robotics'], usedIn: ['f1tenth'] },
  { name: 'OpenCV', groups: ['robotics', 'ai'], usedIn: ['f1tenth'] },
  { name: 'MPCC', groups: ['robotics'], usedIn: ['f1tenth'] },
  { name: 'Sensor fusion', groups: ['robotics'], usedIn: ['f1tenth'] },
  // AI
  { name: 'Python', groups: ['ai', 'quant', 'robotics', 'software'], usedIn: ['volatility', 'chess-ai', 'f1tenth', 'terra-ai', 'voxel-gpu'] },
  { name: 'PyTorch', groups: ['ai'], usedIn: ['chess-ai'] },
  { name: 'Gemini tool calling', groups: ['ai'], usedIn: ['terra-ai'] },
  { name: 'Llama3', groups: ['ai'], usedIn: ['finance-assistant'] },
  { name: 'LLaVA', groups: ['ai'], usedIn: ['finance-assistant'] },
  { name: 'Whisper', groups: ['ai'], usedIn: ['finance-assistant'] },
  // Quant
  { name: 'pandas', groups: ['quant'], usedIn: ['volatility'] },
  { name: 'NumPy', groups: ['quant', 'ai'], usedIn: ['volatility', 'terra-ai'] },
  { name: 'HAR-RV', groups: ['quant'], usedIn: ['volatility'] },
  { name: 'GARCH', groups: ['quant'], usedIn: ['volatility'] },
  { name: 'Gradient boosting', groups: ['quant', 'ai'], usedIn: ['volatility'] },
  { name: 'Hypothesis testing', groups: ['quant'], usedIn: ['volatility'] },
  { name: 'Walk-forward validation', groups: ['quant'], usedIn: ['volatility'] },
]

/** The About section's "system": six subsystems, each backed by real work. */
export const systemNodes: SystemNode[] = [
  {
    id: 'hardware',
    label: 'HARDWARE',
    title: 'I design digital logic that runs at clock speed.',
    body: 'Verilog and SystemVerilog on Cyclone V FPGAs: a 40-stage span GPU at 102 MHz, a 128-core ARC4 cracker, FSM datapaths. I verify against reference models and self-checking testbenches.',
    evidence: ['voxel-gpu', 'arc4', 'baccarat'],
  },
  {
    id: 'systems',
    label: 'SYSTEMS',
    title: 'I like the layer where software meets silicon.',
    body: 'Embedded Linux on ARM Cortex-A9: pthreads pinned to cores, GPU registers mapped through /dev/mem, cache-coherent DMA over the ACP, and a systemd daemon that owns a CRC-checked UART link.',
    evidence: ['voxel-gpu'],
  },
  {
    id: 'software',
    label: 'SOFTWARE',
    title: 'Full-stack when the problem needs it.',
    body: 'TypeScript and Express APIs, Socket.io multiplayer, React and Three.js front ends, Python services, and production voice infrastructure on WebSockets.',
    evidence: ['terra-ai', 'chess-ai', 'finance-assistant'],
  },
  {
    id: 'robotics',
    label: 'ROBOTICS',
    title: 'Code that has to survive the real world.',
    body: 'F1TENTH: MPCC overtaking on a 1/10-scale car, LiDAR and vision perception, and a time-to-collision fail-safe that sits underneath the planner.',
    evidence: ['f1tenth'],
  },
  {
    id: 'ai',
    label: 'AI',
    title: 'Models are components. I wire them in.',
    body: 'PyTorch evaluation networks, LLM function calling with Gemini and Llama3, multimodal pipelines with Whisper and LLaVA, and real-time voice agents on Gemini Live.',
    evidence: ['chess-ai', 'terra-ai', 'finance-assistant'],
  },
  {
    id: 'engineering',
    label: 'ENGINEERING',
    title: 'Measure first, then claim.',
    body: 'Bit-exact reference models, walk-forward validation, Diebold–Mariano tests with multiple-testing correction, and telemetry for reproducible tuning. If a result does not hold up, I report that.',
    evidence: ['volatility', 'voxel-gpu', 'f1tenth'],
  },
]
