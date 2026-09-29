/**
 * @file scripts/migrate_and_seed_canonical_roadmaps.js
 * @description Transactional data migration & 69-node curriculum seeding for CampusLit.
 * Performs:
 *  1. Verification of pre-migration state.
 *  2. Explicit mapping of duplicate roadmaps and nodes based on content.
 *  3. Atomic remapping of student progress (roadmap_id + node_id).
 *  4. Transactional deduplication of colliding student progress records.
 *  5. Removal of duplicate nodes and duplicate roadmaps.
 *  6. Assignment of canonical career slugs and archiving of legacy DevOps.
 *  7. Creation of missing canonical roadmaps (core, higher_ed, founder).
 *  8. Enforcement of uniqueness constraint on roadmaps.career_slug.
 *  9. Authoritative seeding/upsert of all 69 curriculum nodes with full metadata.
 * 10. Enforcement of unique constraint on (roadmap_id, node_key).
 * 11. Comprehensive post-migration integrity assertions (rolls back on any mismatch).
 */

const postgres = require('c:/Projects/campuslit/node_modules/postgres');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
    break;
  }
}
const sql = postgres(dbUrl);

// ============================================================================
// AUTHORITATIVE 69-NODE CURRICULUM DEFINITION
// ============================================================================

const CURRICULUM = {
  sde: [
    {
      sequence_no: 1,
      node_key: 'sde_01',
      title: 'Programming Foundations & Computational Problem Solving',
      branch_key: 'common',
      target_semester: 1,
      difficulty: 'beginner',
      skills: ['Syntax', 'Control Flow', 'Memory Management', 'Unit Testing'],
      prerequisite_keys: [],
      evidence_prompt: 'Repository containing clean implementations of core algorithms (searching, sorting, and recursion) with unit test suites covering edge cases and boundary conditions.'
    },
    {
      sequence_no: 2,
      node_key: 'sde_02',
      title: 'Linux Workstations, POSIX Tooling & Git Version Control',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Git', 'Bash', 'SSH', 'Makefiles', 'POSIX Shell'],
      prerequisite_keys: ['sde_01'],
      evidence_prompt: 'Documented Git repository demonstrating feature branching, squashing, rebase conflict resolution, and automation scripts for environment provisioning and text processing.'
    },
    {
      sequence_no: 3,
      node_key: 'sde_03',
      title: 'Core Data Structures & Computational Complexity',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Linked Lists', 'Trees', 'Hash Tables', 'Heaps', 'Big-O Analysis'],
      prerequisite_keys: ['sde_01'],
      evidence_prompt: 'Benchmarked implementations of custom generic data structures comparing practical execution runtimes against theoretical asymptotic Big-O bounds.'
    },
    {
      sequence_no: 4,
      node_key: 'sde_04',
      title: 'Object-Oriented Design & Clean Architecture Principles',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['SOLID', 'Design Patterns', 'Modularity', 'Refactoring'],
      prerequisite_keys: ['sde_03'],
      evidence_prompt: 'Refactored domain application applying SOLID principles and documented design patterns (Factory, Strategy, Observer) with architectural trade-off analysis.'
    },
    {
      sequence_no: 5,
      node_key: 'sde_05',
      title: 'Advanced Algorithms & Algorithmic Problem Solving',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['Dynamic Programming', 'Graph Algorithms', 'Greedy', 'Trie'],
      prerequisite_keys: ['sde_03'],
      evidence_prompt: 'Solutions to complex graph and dynamic programming problems including written complexity analysis and regression test suites demonstrating optimal state space usage.'
    },
    {
      sequence_no: 6,
      node_key: 'sde_06',
      title: 'Relational & Non-Relational Database Engineering',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['PostgreSQL', 'Indexing', 'Normalization', 'ACID', 'Query Optimization'],
      prerequisite_keys: ['sde_04'],
      evidence_prompt: 'Documented database schema with EXPLAIN ANALYZE execution plans before and after indexing, along with transaction isolation demonstration validating ACID consistency under concurrency.'
    },
    {
      sequence_no: 7,
      node_key: 'sde_07',
      title: 'RESTful APIs & Backend Architecture',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['REST', 'Authentication', 'JWT/OAuth', 'Middleware', 'OpenAPI'],
      prerequisite_keys: ['sde_04', 'sde_06'],
      evidence_prompt: 'Production-ready HTTP web service with OpenAPI documentation, layered separation of concerns, structured logging, validation middleware, and integration tests.'
    },
    {
      sequence_no: 8,
      node_key: 'sde_08',
      title: 'Frontend Engineering & Interactive State Management',
      branch_key: 'common',
      target_semester: 5,
      difficulty: 'intermediate',
      skills: ['TypeScript', 'React/Next.js', 'State Management', 'A11y'],
      prerequisite_keys: ['sde_07'],
      evidence_prompt: 'Responsive web application with accessible semantic markup, deterministic state management across route transitions, and automated end-to-end user interaction tests.'
    },
    {
      sequence_no: 9,
      node_key: 'sde_09',
      title: 'Asynchronous Messaging & Distributed Caching',
      branch_key: 'common',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['Redis', 'Message Queues (RabbitMQ/Kafka)', 'Event-Driven Architecture'],
      prerequisite_keys: ['sde_07'],
      evidence_prompt: 'Event-driven service utilizing message queues for asynchronous task delegation and Redis cache-aside patterns with documented cache invalidation strategies under load.'
    },
    {
      sequence_no: 10,
      node_key: 'sde_10',
      title: 'Containerization, CI/CD Pipelines & Cloud Deployment',
      branch_key: 'common',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['Docker', 'Multi-stage Builds', 'GitHub Actions', 'AWS/GCP'],
      prerequisite_keys: ['sde_07'],
      evidence_prompt: 'Multi-stage Dockerfile producing minimal distroless runtime images integrated with automated CI/CD pipeline verifying linting, testing, and continuous deployment.'
    },
    {
      sequence_no: 11,
      node_key: 'sde_11',
      title: 'Distributed Systems & High-Level System Design',
      branch_key: 'common',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['Load Balancing', 'Partitioning', 'CAP Theorem', 'Fault Tolerance'],
      prerequisite_keys: ['sde_09', 'sde_10'],
      evidence_prompt: 'Comprehensive architecture design document detailing data partitioning, replication models, consistency trade-offs, and failure recovery protocols for a high-concurrency distributed system.'
    },
    {
      sequence_no: 12,
      node_key: 'sde_12',
      title: 'Full-Stack Engineering Capstone',
      branch_key: 'common',
      target_semester: 7,
      difficulty: 'advanced',
      skills: ['Full-Stack Architecture', 'Observability', 'Telemetry', 'E2E Testing'],
      prerequisite_keys: ['sde_08', 'sde_10', 'sde_11'],
      evidence_prompt: 'Deployed production application featuring database migrations, automated test suites, structured telemetry/monitoring dashboards, and public documentation demonstrating end-to-end functionality.'
    },
    {
      sequence_no: 13,
      node_key: 'sde_13',
      title: 'Technical Interview Preparedness & Behavioral Readiness',
      branch_key: 'common',
      target_semester: 8,
      difficulty: 'intermediate',
      skills: ['Live Coding', 'Code Review', 'Mock Interviews', 'STAR Method'],
      prerequisite_keys: ['sde_05', 'sde_11'],
      evidence_prompt: 'Documented peer code reviews, recorded mock technical interviews analyzing algorithmic trade-offs, and structured STAR-method engineering retrospectives.'
    }
  ],

  ai_ml: [
    {
      sequence_no: 1,
      node_key: 'aiml_01',
      title: 'Numerical Computing & Scientific Python Stack',
      branch_key: 'common',
      target_semester: 1,
      difficulty: 'beginner',
      skills: ['NumPy', 'Vectorization', 'Pandas', 'Numerical Stability'],
      prerequisite_keys: [],
      evidence_prompt: 'Vectorized data processing notebook comparing native iteration against broadcast operations alongside empirical memory profiling across structured tabular datasets.'
    },
    {
      sequence_no: 2,
      node_key: 'aiml_02',
      title: 'Mathematical Foundations for Machine Learning',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Linear Algebra', 'Multivariable Calculus', 'SVD', 'Gradient Descent'],
      prerequisite_keys: ['aiml_01'],
      evidence_prompt: 'Mathematical notebook implementing gradient descent, matrix decompositions (SVD/Eigenvalues), and loss optimization from first mathematical principles without ML libraries.'
    },
    {
      sequence_no: 3,
      node_key: 'aiml_03',
      title: 'Exploratory Data Analysis & Statistical Inference',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Hypothesis Testing', 'Distribution Fitting', 'Feature Correlation'],
      prerequisite_keys: ['aiml_01'],
      evidence_prompt: 'Statistical analysis report containing distribution testing, correlation significance validation, multivariate outlier analysis, and clean domain feature engineering pipelines.'
    },
    {
      sequence_no: 4,
      node_key: 'aiml_04',
      title: 'Classical Machine Learning: Supervised Algorithms',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['Regression', 'Classification', 'Regularization', 'Cross-Validation'],
      prerequisite_keys: ['aiml_02', 'aiml_03'],
      evidence_prompt: 'Comparative evaluation notebook analyzing linear models, decision trees, and ensemble methods using k-fold cross-validation, precision-recall analysis, and hyperparameter tuning.'
    },
    {
      sequence_no: 5,
      node_key: 'aiml_05',
      title: 'Classical Machine Learning: Unsupervised & Clustering',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['K-Means', 'PCA', 'Hierarchical Clustering', 'Dimensionality Reduction'],
      prerequisite_keys: ['aiml_04'],
      evidence_prompt: 'Unsupervised analysis pipeline evaluating cluster validity indices (Silhouette, Davies-Bouldin) and PCA dimensionality reduction explaining cumulative variance ratios.'
    },
    {
      sequence_no: 6,
      node_key: 'aiml_06',
      title: 'Deep Learning Fundamentals & Backpropagation',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Neural Networks', 'Backprop', 'PyTorch', 'Optimizers', 'Loss Surfaces'],
      prerequisite_keys: ['aiml_02', 'aiml_04'],
      evidence_prompt: 'From-scratch autograd or PyTorch neural network training log visualizing activation histograms, gradient flow health, and training/validation loss curve convergence.'
    },
    {
      sequence_no: 7,
      node_key: 'aiml_07',
      title: 'Computer Vision Architectures & Transfer Learning',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['CNNs', 'ResNet', 'Data Augmentation', 'Object Detection'],
      prerequisite_keys: ['aiml_06'],
      evidence_prompt: 'Vision model pipeline comparing fine-tuned CNN feature extractors against scratch models, accompanied by confusion matrices and class-activation interpretability maps (Grad-CAM).'
    },
    {
      sequence_no: 8,
      node_key: 'aiml_08',
      title: 'Sequence Modeling & Natural Language Processing',
      branch_key: 'common',
      target_semester: 5,
      difficulty: 'intermediate',
      skills: ['Tokenization', 'Embeddings', 'Attention Mechanisms', 'RNNs/Transformers'],
      prerequisite_keys: ['aiml_06'],
      evidence_prompt: 'Text classification or generation model evaluating custom vector embeddings, self-attention representations, and token-level error analysis on unseen corpora.'
    },
    {
      sequence_no: 9,
      node_key: 'aiml_09',
      title: 'Transformer Architectures & Large Language Models',
      branch_key: 'common',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['Multi-Head Attention', 'BERT', 'GPT', 'Hugging Face', 'Quantization'],
      prerequisite_keys: ['aiml_08'],
      evidence_prompt: 'Transformer implementation or fine-tuning notebook detailing parameter-efficient adaptations (LoRA), perplexity measurements, and inference memory benchmarking.'
    },
    {
      sequence_no: 10,
      node_key: 'aiml_10',
      title: 'MLOps: Experiment Tracking & Model Artifact Registries',
      branch_key: 'common',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['MLflow', 'Weights & Biases', 'DVC', 'Model Versioning'],
      prerequisite_keys: ['aiml_04', 'aiml_06'],
      evidence_prompt: 'Versioned experiment registry documenting parameter tracking, model artifact registration, dataset hashing via DVC, and reproducible pipeline execution runs.'
    },
    {
      sequence_no: 11,
      node_key: 'aiml_11',
      title: 'Production Model Serving & Optimized Inference Systems',
      branch_key: 'common',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['ONNX', 'TorchScript', 'FastAPI', 'Batch Inference', 'Latency Benchmarking'],
      prerequisite_keys: ['aiml_10'],
      evidence_prompt: 'Containerized model serving API with ONNX runtime acceleration, request queue batching, and documented latency percentiles (p50, p99) under simulated load.'
    },
    {
      sequence_no: 12,
      node_key: 'aiml_12',
      title: 'End-to-End AI/ML Capstone',
      branch_key: 'common',
      target_semester: 7,
      difficulty: 'advanced',
      skills: ['Pipeline Orchestration', 'Data Drift', 'CI/CD for ML', 'Monitoring'],
      prerequisite_keys: ['aiml_09', 'aiml_11'],
      evidence_prompt: 'Deployed production ML service incorporating automated retraining pipelines, data drift detection mechanisms, monitoring dashboards, and comprehensive technical documentation.'
    },
    {
      sequence_no: 13,
      node_key: 'aiml_13',
      title: 'Applied AI Ethics, Bias Auditing & Safety Engineering',
      branch_key: 'common',
      target_semester: 8,
      difficulty: 'intermediate',
      skills: ['Disparate Impact', 'Model Interpretability', 'SHAP/LIME', 'Safety Guardrails'],
      prerequisite_keys: ['aiml_12'],
      evidence_prompt: 'Bias and robustness audit report utilizing SHAP interpretability values, disparate impact ratio measurements across protected features, and adversarial input evaluations.'
    }
  ],

  core: [
    {
      sequence_no: 1,
      node_key: 'core_01',
      title: 'Circuit Analysis, Electrical Laws & Instrumentation',
      branch_key: 'common',
      target_semester: 1,
      difficulty: 'beginner',
      skills: ["Ohm's/Kirchhoff's Laws", 'Multimeters', 'Oscilloscopes', 'SPICE'],
      prerequisite_keys: [],
      evidence_prompt: 'SPICE simulation schematics correlated with physical bench oscilloscope measurements documenting transient circuit response and voltage divider network loading effects.'
    },
    {
      sequence_no: 2,
      node_key: 'core_02',
      title: 'Digital Logic Design, State Machines & Combinational Systems',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Boolean Algebra', 'Logic Gates', 'Multiplexers', 'FSMs'],
      prerequisite_keys: ['core_01'],
      evidence_prompt: 'Simulated digital design repository containing timing diagrams for synchronous finite state machines with hazard analysis and state transition minimization proofs.'
    },
    {
      sequence_no: 3,
      node_key: 'core_03',
      title: 'Low-Level C Programming & Computer Architecture',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Pointer Arithmetic', 'Memory Registers', 'Bitwise Logic', 'Von Neumann'],
      prerequisite_keys: ['core_01'],
      evidence_prompt: 'Modular C codebase demonstrating direct register manipulation, pointer arithmetic safety, bitwise mask operations, and memory alignment inspections.'
    },
    {
      sequence_no: 4,
      node_key: 'core_04',
      title: 'Microcontroller Architectures & Peripheral Interfacing',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['ARM Cortex-M', 'GPIO', 'Timers', 'ADC', 'Interrupt Service Routines'],
      prerequisite_keys: ['core_02', 'core_03'],
      evidence_prompt: 'Bare-metal firmware project configuring hardware timer interrupts, ADC sampling routines, and nested interrupt controllers with oscilloscope-verified timing.'
    },
    {
      sequence_no: 5,
      node_key: 'core_05',
      title: 'Serial Communication Protocols & Signal Integrity',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['UART', 'SPI', 'I2C', 'Logic Analyzers', 'Baud Rates'],
      prerequisite_keys: ['core_04'],
      evidence_prompt: 'Logic analyzer packet captures validating multi-device master-slave I2C and high-speed SPI transactions with protocol decode annotations and timing analyses.'
    },
    {
      sequence_no: 6,
      node_key: 'core_06',
      title: 'Analog Signal Conditioning & Sensor Interfacing',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Op-Amps', 'Active Filters', 'DAC', 'Wheatstone Bridges'],
      prerequisite_keys: ['core_04'],
      evidence_prompt: 'Analog front-end circuit schematic and SPICE frequency analysis demonstrating noise attenuation, active filtering, and linear amplification of low-voltage transducer signals.'
    },
    {
      sequence_no: 7,
      node_key: 'core_07',
      title: 'Core Specialization Gateway: Embedded vs IoT vs Robotics',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Technical Evaluation', 'Trade-off Analysis', 'Toolchain Setup'],
      prerequisite_keys: ['core_06'],
      evidence_prompt: 'Architectural technical proposal justifying the chosen core specialization (Embedded, IoT, or Robotics) based on hardware constraints, protocols, and tooling workflows.'
    },
    {
      sequence_no: 8,
      node_key: 'core_08a',
      title: 'Real-Time Operating Systems (RTOS) Architecture',
      branch_key: 'embedded',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['FreeRTOS', 'Task Scheduling', 'Semaphores', 'Mutexes', 'Queues'],
      prerequisite_keys: ['core_07'],
      evidence_prompt: 'Multi-task RTOS firmware project validating deterministic priority preemption, inter-task queue communications, and mutex priority inheritance to prevent priority inversion.'
    },
    {
      sequence_no: 9,
      node_key: 'core_09a',
      title: 'Hardware Protocols & Low-Level Device Drivers',
      branch_key: 'embedded',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['DMA', 'CAN Bus', 'Flash Memory Drivers', 'Watchdog Timers'],
      prerequisite_keys: ['core_08a'],
      evidence_prompt: 'Custom bare-metal device driver utilizing DMA circular buffers and CAN bus transceivers with error-handling routines for bus-off and overrun conditions.'
    },
    {
      sequence_no: 10,
      node_key: 'core_08b',
      title: 'Wireless Sensor Networks & IoT Connectivity Protocols',
      branch_key: 'iot',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['MQTT', 'CoAP', 'BLE', 'Wi-Fi Stacks', 'Low-Power Paging'],
      prerequisite_keys: ['core_07'],
      evidence_prompt: 'Network trace capture documenting secure MQTT broker publish-subscribe handshakes and battery-conscious deep-sleep wake cycle current profiling.'
    },
    {
      sequence_no: 11,
      node_key: 'core_09b',
      title: 'Edge Computing, Telemetry & IoT Cloud Ingestion',
      branch_key: 'iot',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['Edge Processing', 'TLS Mutual Auth', 'AWS IoT/GCP', 'Time-Series'],
      prerequisite_keys: ['core_08b'],
      evidence_prompt: 'Secure IoT telemetry system featuring TLS certificate authentication, edge payload compression, and cloud time-series database ingestion with schema documentation.'
    },
    {
      sequence_no: 12,
      node_key: 'core_08c',
      title: 'Kinematics, Actuators & Motor Control Systems',
      branch_key: 'robotics',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['PWM', 'H-Bridges', 'Forward/Inverse Kinematics', 'PID Control'],
      prerequisite_keys: ['core_07'],
      evidence_prompt: 'Implemented closed-loop PID motor velocity controller with encoder feedback demonstrating step-response tuning analysis and overshoot dampening.'
    },
    {
      sequence_no: 13,
      node_key: 'core_09c',
      title: 'Robot Operating System (ROS 2) & Sensor Fusion',
      branch_key: 'robotics',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['ROS 2 Nodes', 'TF2', 'LiDAR', 'IMU', 'Extended Kalman Filter'],
      prerequisite_keys: ['core_08c'],
      evidence_prompt: 'ROS 2 workspace package implementing sensor fusion (IMU and wheel odometry) via Extended Kalman Filtering alongside URDF coordinate frame transformations.'
    },
    {
      sequence_no: 14,
      node_key: 'core_10',
      title: 'PCB Schematic Design, Layout & Signal Integrity',
      branch_key: 'common',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['KiCad', 'Multilayer Routing', 'Decoupling', 'DRC', 'Gerber Verification'],
      prerequisite_keys: ['core_06'],
      evidence_prompt: 'Complete KiCad PCB design project including schematic DRC clearance, 2-to-4 layer routed layout with ground planes, impedance calculations, and Gerber manufacturing files.'
    },
    {
      sequence_no: 15,
      node_key: 'core_11',
      title: 'Core Hardware/Firmware Integrated Capstone',
      branch_key: 'common',
      target_semester: 7,
      difficulty: 'advanced',
      skills: ['Systems Integration', 'Firmware Verification', 'Thermal/Power Analysis'],
      prerequisite_keys: ['core_10'],
      evidence_prompt: 'Working physical or comprehensive hardware-in-the-loop prototype combining custom PCB hardware, firmware drivers, power profiling measurements, and full operational documentation.'
    }
  ],

  higher_ed: [
    {
      sequence_no: 1,
      node_key: 'he_01',
      title: 'Research Methodology, Technical Writing & Literature Review',
      branch_key: 'common',
      target_semester: 1,
      difficulty: 'beginner',
      skills: ['Literature Synthesis', 'Citation Management', 'LaTeX', 'Research Ethics'],
      prerequisite_keys: [],
      evidence_prompt: 'Formal LaTeX survey paper synthesizing recent peer-reviewed literature in a chosen domain with structured taxonomy, critique, and verified bibliographic citations.'
    },
    {
      sequence_no: 2,
      node_key: 'he_02',
      title: 'Academic Foundations & Advanced Mathematical Reasoning',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Discrete Mathematics', 'Proof Techniques', 'Probability Theory'],
      prerequisite_keys: ['he_01'],
      evidence_prompt: 'Mathematical portfolio containing formal proofs (induction, contradiction, combinatorial invariants) and probabilistic analysis of randomized algorithms.'
    },
    {
      sequence_no: 3,
      node_key: 'he_03',
      title: 'Post-Graduate Pathway Gateway: GATE vs MS vs MBA',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['Comparative Evaluation', 'Career Mapping', 'Prerequisite Auditing'],
      prerequisite_keys: ['he_02'],
      evidence_prompt: 'Comparative study and career map aligning academic strengths and professional goals to the chosen post-graduate pathway (GATE/M.Tech, MS Research, or MBA).'
    },
    {
      sequence_no: 4,
      node_key: 'he_04a',
      title: 'GATE Core Engineering Theory & Subject Mastery I',
      branch_key: 'gate',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Engineering Math', 'Digital Logic', 'Computer Organization'],
      prerequisite_keys: ['he_03'],
      evidence_prompt: 'Systematic test-series performance analysis detailing error categorization, formula derivation proofs, and conceptual gap remediation across foundational core subjects.'
    },
    {
      sequence_no: 5,
      node_key: 'he_05a',
      title: 'GATE Core Engineering Theory & Subject Mastery II',
      branch_key: 'gate',
      target_semester: 5,
      difficulty: 'intermediate',
      skills: ['Data Structures', 'Algorithms', 'Theory of Computation'],
      prerequisite_keys: ['he_04a'],
      evidence_prompt: 'Detailed problem-solving notebook demonstrating mastery of Turing machines, context-free grammars, complexity classes, and graph-theoretical proofs.'
    },
    {
      sequence_no: 6,
      node_key: 'he_06a',
      title: 'GATE Systems Engineering Mastery',
      branch_key: 'gate',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['Operating Systems', 'Database Systems', 'Computer Networks'],
      prerequisite_keys: ['he_05a'],
      evidence_prompt: 'Rigorous solutions to advanced GATE systems problems covering virtual memory translation, deadlock dynamics, indexing depths, and TCP flow control calculations.'
    },
    {
      sequence_no: 7,
      node_key: 'he_07a',
      title: 'Comprehensive GATE Mock Evaluation & Time Management',
      branch_key: 'gate',
      target_semester: 7,
      difficulty: 'advanced',
      skills: ['Test Simulation', 'Negative Marking Control', 'Accuracy Optimization'],
      prerequisite_keys: ['he_06a'],
      evidence_prompt: 'Comprehensive mock examination audit comparing speed-accuracy trade-offs, negative marking reductions, and time-allocation adjustments across multi-subject papers.'
    },
    {
      sequence_no: 8,
      node_key: 'he_08a',
      title: 'PSU Technical Interviews & Post-GATE M.Tech Defense Prep',
      branch_key: 'gate',
      target_semester: 8,
      difficulty: 'advanced',
      skills: ['Technical Interviewing', 'Core Viva Defense', 'PSU General Aptitude'],
      prerequisite_keys: ['he_07a'],
      evidence_prompt: 'Documented technical viva voce simulations answering foundational theoretical questions and technical problem-solving defenses for IISc/IIT admissions and PSU panels.'
    },
    {
      sequence_no: 9,
      node_key: 'he_04b',
      title: 'International Standardized Testing: GRE Quantitative & Verbal',
      branch_key: 'ms',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Quantitative Problem Solving', 'Analytical Writing', 'Lexical Analysis'],
      prerequisite_keys: ['he_03'],
      evidence_prompt: 'Analytical writing argument critiques and timed quantitative diagnostic performance analyses documenting systematic reduction in reasoning errors.'
    },
    {
      sequence_no: 10,
      node_key: 'he_05b',
      title: 'Global English Language Proficiency: TOEFL / IELTS',
      branch_key: 'ms',
      target_semester: 5,
      difficulty: 'intermediate',
      skills: ['Academic Listening', 'Integrated Speaking', 'Academic Argumentation'],
      prerequisite_keys: ['he_03'],
      evidence_prompt: 'Transcribed recorded academic speaking responses and structured argumentative essays evaluated against CEFR/band-level standardized rubrics.'
    },
    {
      sequence_no: 11,
      node_key: 'he_06b',
      title: 'Academic Statement of Purpose & Scholarly Letters of Rec',
      branch_key: 'ms',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['SOP Drafting', 'Faculty Outreach', 'Research Trajectory Mapping'],
      prerequisite_keys: ['he_01', 'he_05b'],
      evidence_prompt: 'Tailored Statement of Purpose mapping academic research accomplishments to prospective graduate laboratories, accompanied by detailed CV and faculty inquiry portfolios.'
    },
    {
      sequence_no: 12,
      node_key: 'he_07b',
      title: 'University Shortlisting, Candidacy Evaluation & Financial Planning',
      branch_key: 'ms',
      target_semester: 7,
      difficulty: 'advanced',
      skills: ['Academic Benchmarking', 'Institutional Comparison', 'Financial Planning'],
      prerequisite_keys: ['he_06b'],
      evidence_prompt: 'Data-backed institutional matrix categorizing target institutions into Ambition, Target, and Safe tiers based on admission profiles, lab funding, and financial plans.'
    },
    {
      sequence_no: 13,
      node_key: 'he_04c',
      title: 'Business Aptitude Foundations: CAT / GMAT Quantitative & Logic',
      branch_key: 'mba',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Data Interpretation', 'Logical Reasoning', 'Quantitative Aptitude'],
      prerequisite_keys: ['he_03'],
      evidence_prompt: 'Detailed performance diagnostics across timed sections of Data Interpretation and Logical Reasoning (DILR), identifying structural heuristic patterns.'
    },
    {
      sequence_no: 14,
      node_key: 'he_05c',
      title: 'Verbal Ability, Reading Comprehension & Critical Reasoning',
      branch_key: 'mba',
      target_semester: 5,
      difficulty: 'intermediate',
      skills: ['Critical Reasoning', 'Argument Analysis', 'Paragraph Summaries'],
      prerequisite_keys: ['he_04c'],
      evidence_prompt: 'Written argument deconstruction log evaluating premise-conclusion validity, fallacy identification, and inference deduction across complex business passages.'
    },
    {
      sequence_no: 15,
      node_key: 'he_06c',
      title: 'Case Study Methodologies & Business Communication',
      branch_key: 'mba',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['Market Sizing', 'Profitability Frameworks', 'Executive Presentation'],
      prerequisite_keys: ['he_05c'],
      evidence_prompt: 'Structured business case analysis applying strategic frameworks (MECE, Porter\'s Five Forces, 4Ps) to real-world corporate strategy problems with executive slide summaries.'
    },
    {
      sequence_no: 16,
      node_key: 'he_08',
      title: 'Higher Education Capstone: Application Portfolio & Defense',
      branch_key: 'common',
      target_semester: 8,
      difficulty: 'advanced',
      skills: ['Portfolio Compilation', 'Interview Defense', 'Research Proposal', 'Decision Analysis'],
      prerequisite_keys: ['he_03'],
      evidence_prompt: 'Completed student-controlled post-graduate dossier containing finalized application packages, faculty interview/defense preparation notes, research proposals, and a documented admissions decision and contingency analysis.'
    }
  ],

  founder: [
    {
      sequence_no: 1,
      node_key: 'fnd_01',
      title: 'Problem Identification, Market Research & Ideation',
      branch_key: 'common',
      target_semester: 1,
      difficulty: 'beginner',
      skills: ['TAM/SAM/SOM Calculation', 'Problem Validation', 'Market Research'],
      prerequisite_keys: [],
      evidence_prompt: 'Structured market opportunity document detailing problem statement validation, TAM/SAM/SOM sizing calculations, and existing competitive landscape analysis.'
    },
    {
      sequence_no: 2,
      node_key: 'fnd_02',
      title: 'Customer Discovery & The Mom Test Methodology',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['User Interviews', 'The Mom Test', 'Qualitative Analysis'],
      prerequisite_keys: ['fnd_01'],
      evidence_prompt: 'Qualitative synthesis report of structured user discovery interviews conducted using Mom Test principles, isolating acute pain points from conversational noise.'
    },
    {
      sequence_no: 3,
      node_key: 'fnd_03',
      title: 'Rapid Wireframing, UX Prototyping & User Journeys',
      branch_key: 'common',
      target_semester: 2,
      difficulty: 'beginner',
      skills: ['Wireframing', 'Figma', 'User Flow Architecture', 'Usability Testing'],
      prerequisite_keys: ['fnd_02'],
      evidence_prompt: 'Interactive Figma prototype demonstrating primary customer workflows, accompanied by documented user walkthrough feedback and usability friction fixes.'
    },
    {
      sequence_no: 4,
      node_key: 'fnd_04',
      title: 'Lean Minimum Viable Product (MVP) Engineering',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['Rapid Development', 'Scoping', 'Core Value Proposition'],
      prerequisite_keys: ['fnd_03'],
      evidence_prompt: 'Functioning MVP software application or hardware prototype providing core value functionality with all non-essential features scoped out.'
    },
    {
      sequence_no: 5,
      node_key: 'fnd_05',
      title: 'Landing Page Validation & Quantitative Signal Gathering',
      branch_key: 'common',
      target_semester: 3,
      difficulty: 'intermediate',
      skills: ['Landing Page Optimization', 'Analytics Setup', 'Funnel Analysis'],
      prerequisite_keys: ['fnd_04'],
      evidence_prompt: 'Live landing page with integrated product analytics tracking conversion rates, user drop-offs, and customer waitlist sign-ups.'
    },
    {
      sequence_no: 6,
      node_key: 'fnd_06',
      title: 'Alpha Cohort Onboarding & Product Feedback Loops',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Cohort Management', 'Qualitative Interviews', 'Feature Prioritization'],
      prerequisite_keys: ['fnd_05'],
      evidence_prompt: 'Cohort feedback log documenting user onboarding sessions, recurring feature request matrices, and resulting product issue triage.'
    },
    {
      sequence_no: 7,
      node_key: 'fnd_07',
      title: 'Business Model Design & Unit Economics Modeling',
      branch_key: 'common',
      target_semester: 4,
      difficulty: 'intermediate',
      skills: ['Unit Economics', 'LTV/CAC Modeling', 'Revenue Architecture'],
      prerequisite_keys: ['fnd_06'],
      evidence_prompt: 'Financial model spreadsheet forecasting unit economics, customer acquisition costs (CAC), lifetime value (LTV), margin structure, and operational runway scenarios.'
    },
    {
      sequence_no: 8,
      node_key: 'fnd_08',
      title: 'Go-To-Market (GTM) Strategy & Distribution Engineering',
      branch_key: 'common',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['Content Marketing', 'Direct Sales', 'Organic Distribution', 'Funnel Optimization'],
      prerequisite_keys: ['fnd_07'],
      evidence_prompt: 'Documented go-to-market experiment tracking multiple distribution channels, showing customer acquisition funnel data and channel-specific conversion analytics.'
    },
    {
      sequence_no: 9,
      node_key: 'fnd_09',
      title: 'Product-Market Fit (PMF) Metrics & Retention Analysis',
      branch_key: 'common',
      target_semester: 5,
      difficulty: 'advanced',
      skills: ['Cohort Retention Curves', 'Sean Ellis Survey', 'Churn Diagnostics'],
      prerequisite_keys: ['fnd_08'],
      evidence_prompt: 'Cohort retention analysis showing repeated user engagement curves alongside Sean Ellis PMF survey evaluation results and churn root-cause documentation.'
    },
    {
      sequence_no: 10,
      node_key: 'fnd_10',
      title: 'Startup Legalities, Cap Table & Entity Incorporation',
      branch_key: 'common',
      target_semester: 6,
      difficulty: 'advanced',
      skills: ['Incorporation', 'Equity Vesting', 'Cap Tables', 'IP Assignment'],
      prerequisite_keys: ['fnd_07'],
      evidence_prompt: 'Drafted corporate documents including founder equity vesting schedules, cap table simulation models, IP assignment agreements, and regulatory compliance checklists.'
    },
    {
      sequence_no: 11,
      node_key: 'fnd_11',
      title: 'Investor Pitch Deck & Financial Storytelling',
      branch_key: 'common',
      target_semester: 7,
      difficulty: 'advanced',
      skills: ['Pitch Deck Construction', 'Narrative Framing', 'Financial Modeling'],
      prerequisite_keys: ['fnd_09', 'fnd_10'],
      evidence_prompt: '10-to-12 slide investor pitch deck addressing problem, solution, market size, business model, defensibility moats, traction metrics, and capital allocation plan.'
    },
    {
      sequence_no: 12,
      node_key: 'fnd_12',
      title: 'Venture Launch / Demo Day Capstone',
      branch_key: 'common',
      target_semester: 8,
      difficulty: 'advanced',
      skills: ['Product Launch', 'Investor Presentation', 'Customer Acquisition'],
      prerequisite_keys: ['fnd_04', 'fnd_11'],
      evidence_prompt: 'Public launch event record (Product Hunt/Demo Day/incubator presentation) documenting live customer transactions, trial deployments, or pilot letters of intent.'
    }
  ]
};

// ============================================================================
// MAIN TRANSACTIONAL MIGRATION & SEED RUNNER
// ============================================================================

async function migrateAndSeed() {
  console.log('Starting CampusLit Canonical Roadmap Data Migration & Seeding...\n');

  try {
    await sql.begin(async (tx) => {
      // ----------------------------------------------------------------------
      // STEP 1: VERIFY PRE-MIGRATION STATE
      // ----------------------------------------------------------------------
      console.log('Step 1: Inspecting pre-migration database state...');
      const preRoadmaps = await tx`SELECT roadmap_id, title FROM roadmaps ORDER BY roadmap_id`;
      const preNodes = await tx`SELECT node_id, roadmap_id, sequence_no, title FROM roadmap_nodes ORDER BY node_id`;
      const preProgress = await tx`SELECT progress_id, user_id, roadmap_id, node_id, status FROM student_roadmap_progress ORDER BY progress_id`;

      console.log(`Pre-migration state: ${preRoadmaps.length} roadmaps, ${preNodes.length} nodes, ${preProgress.length} progress records.`);

      let alreadyMigrated = false;
      if (preRoadmaps.length === 6 && preNodes.length === 69 && preProgress.length === 20) {
        console.log('Database cleanup already completed (6 roadmaps, 69 nodes, 20 progress records). Running in idempotent seed & verify mode...');
        alreadyMigrated = true;
      } else if (preRoadmaps.length === 15 && preNodes.length === 30 && preProgress.length === 28) {
        console.log('Detected initial pre-migration state. Proceeding with full cleanup, deduplication, and seeding...');
      } else {
        throw new Error(`Pre-migration verification failed! Expected either initial state (15 roadmaps, 30 nodes, 28 progress rows) or migrated state (6 roadmaps, 69 nodes, 20 progress rows). Found: ${preRoadmaps.length} roadmaps, ${preNodes.length} nodes, ${preProgress.length} progress rows.`);
      }

      if (!alreadyMigrated) {
        // ----------------------------------------------------------------------
        // STEP 2: VERIFY CANONICAL AND DUPLICATE CLASSIFICATIONS
        // ----------------------------------------------------------------------
        console.log('Step 2: Classifying roadmaps based on verified database contents...');
        const sdeRoadmaps = preRoadmaps.filter(r => r.title.includes('Full-Stack Web Developer Roadmap')).map(r => Number(r.roadmap_id));
        const aimlRoadmaps = preRoadmaps.filter(r => r.title.includes('AI & Machine Learning Engineer Roadmap')).map(r => Number(r.roadmap_id));
        const devopsRoadmaps = preRoadmaps.filter(r => r.title.includes('Cloud Native & DevOps Engineer Roadmap')).map(r => Number(r.roadmap_id));

        console.log('Identified SDE Roadmap IDs:', sdeRoadmaps);
        console.log('Identified AI/ML Roadmap IDs:', aimlRoadmaps);
        console.log('Identified DevOps Roadmap IDs:', devopsRoadmaps);

        if (sdeRoadmaps.length !== 5 || aimlRoadmaps.length !== 5 || devopsRoadmaps.length !== 5) {
          throw new Error('Roadmap classification failed: expected 5 SDE, 5 AI/ML, and 5 DevOps roadmaps.');
        }

        const canonicalSdeId = sdeRoadmaps[0]; // ID 1
        const canonicalAimlId = aimlRoadmaps[0]; // ID 2
        const archivedDevopsId = devopsRoadmaps[0]; // ID 3

        const duplicateSdeIds = sdeRoadmaps.slice(1); // [5, 8, 11, 14]
        const duplicateAimlIds = aimlRoadmaps.slice(1); // [6, 9, 12, 15]
        const duplicateDevopsIds = devopsRoadmaps.slice(1); // [7, 10, 13, 16]

        console.log(`Canonical SDE ID: ${canonicalSdeId}, AI/ML ID: ${canonicalAimlId}, Archived DevOps ID: ${archivedDevopsId}`);

        // ----------------------------------------------------------------------
        // STEP 3: BUILD EXPLICIT REMAPPING TABLES
        // ----------------------------------------------------------------------
        console.log('Step 3: Creating and populating temporary mapping tables...');
        await tx`CREATE TEMP TABLE temp_roadmap_remap (duplicate_roadmap_id INT PRIMARY KEY, canonical_roadmap_id INT NOT NULL)`;
        await tx`CREATE TEMP TABLE temp_node_remap (duplicate_node_id INT PRIMARY KEY, canonical_node_id INT NOT NULL)`;

      for (const dupId of duplicateSdeIds) {
        await tx`INSERT INTO temp_roadmap_remap (duplicate_roadmap_id, canonical_roadmap_id) VALUES (${dupId}, ${canonicalSdeId})`;
      }

      // Map SDE nodes by sequence_no and title
      const canonicalNodes = await tx`SELECT node_id, sequence_no, title FROM roadmap_nodes WHERE roadmap_id = ${canonicalSdeId}`;
      const duplicateNodes = await tx`SELECT node_id, roadmap_id, sequence_no, title FROM roadmap_nodes WHERE roadmap_id IN ${tx(duplicateSdeIds)}`;

      for (const dNode of duplicateNodes) {
        const cNode = canonicalNodes.find(cn => cn.sequence_no === dNode.sequence_no && cn.title === dNode.title);
        if (!cNode) {
          throw new Error(`Unmapped duplicate node! ID ${dNode.node_id}, title: "${dNode.title}", seq: ${dNode.sequence_no}`);
        }
        await tx`INSERT INTO temp_node_remap (duplicate_node_id, canonical_node_id) VALUES (${dNode.node_id}, ${cNode.node_id})`;
      }

      const [{ count: mappedNodeCount }] = await tx`SELECT count(*)::int FROM temp_node_remap`;
      console.log(`Explicitly mapped ${mappedNodeCount} duplicate nodes to canonical counterparts.`);
      if (mappedNodeCount !== 24) {
        throw new Error(`Expected exactly 24 mapped duplicate nodes, found: ${mappedNodeCount}`);
      }

      // ----------------------------------------------------------------------
      // STEP 4: REMAP STUDENT PROGRESS
      // ----------------------------------------------------------------------
      console.log('Step 4: Remapping student progress referencing duplicate nodes/roadmaps...');
      const updateResult = await tx`
        UPDATE student_roadmap_progress srp
        SET 
          roadmap_id = ${canonicalSdeId},
          node_id = t.canonical_node_id
        FROM temp_node_remap t
        WHERE srp.node_id = t.duplicate_node_id
      `;
      console.log(`Remapped progress rows updated: ${updateResult.count}`);
      if (updateResult.count !== 8) {
        throw new Error(`Expected exactly 8 progress rows to be remapped, got ${updateResult.count}`);
      }

      // ----------------------------------------------------------------------
      // STEP 5: DEDUPLICATE STUDENT PROGRESS SAFELY
      // ----------------------------------------------------------------------
      console.log('Step 5: Deduplicating colliding student progress records...');
      // Retain the record with the most advanced status: 'completed' > 'in_progress' > 'not_started'
      const dupProgressDeleted = await tx`
        DELETE FROM student_roadmap_progress
        WHERE progress_id IN (
          SELECT progress_id FROM (
            SELECT 
              progress_id,
              ROW_NUMBER() OVER (
                PARTITION BY user_id, node_id 
                ORDER BY 
                  CASE status 
                    WHEN 'completed' THEN 1 
                    WHEN 'in_progress' THEN 2 
                    ELSE 3 
                  END,
                  completed_at ASC NULLS LAST,
                  progress_id ASC
              ) as rn
            FROM student_roadmap_progress
          ) ranked
          WHERE ranked.rn > 1
        )
      `;
      console.log(`Duplicate progress rows safely removed: ${dupProgressDeleted.count}`);
      if (dupProgressDeleted.count !== 8) {
        throw new Error(`Expected exactly 8 duplicate progress rows removed, got ${dupProgressDeleted.count}`);
      }

      // Verify no remaining duplicate (user_id, node_id) pairs
      const duplicatePairs = await tx`
        SELECT user_id, node_id, count(*)::int
        FROM student_roadmap_progress
        GROUP BY user_id, node_id
        HAVING count(*) > 1
      `;
      if (duplicatePairs.length > 0) {
        throw new Error(`Duplicate progress pairs still exist: ${JSON.stringify(duplicatePairs)}`);
      }

      // ----------------------------------------------------------------------
      // STEP 6: VERIFY ZERO REFERENCES BEFORE DELETE
      // ----------------------------------------------------------------------
      console.log('Step 6: Verifying zero student progress references to duplicate entities...');
      const allDuplicateRoadmapIds = [...duplicateSdeIds, ...duplicateAimlIds, ...duplicateDevopsIds];
      const [{ count: orphanProgressRoadmapCount }] = await tx`
        SELECT count(*)::int FROM student_roadmap_progress WHERE roadmap_id IN ${tx(allDuplicateRoadmapIds)}
      `;
      const [{ count: orphanProgressNodeCount }] = await tx`
        SELECT count(*)::int FROM student_roadmap_progress WHERE node_id IN (SELECT duplicate_node_id FROM temp_node_remap)
      `;
      if (orphanProgressRoadmapCount > 0 || orphanProgressNodeCount > 0) {
        throw new Error(`Integrity check failed: ${orphanProgressRoadmapCount} progress rows point to duplicate roadmaps, ${orphanProgressNodeCount} point to duplicate nodes.`);
      }

      // ----------------------------------------------------------------------
      // STEP 7: DELETE LEGACY DUPLICATES
      // ----------------------------------------------------------------------
      console.log('Step 7: Deleting legacy duplicate nodes and duplicate roadmaps...');
      const deletedNodes = await tx`
        DELETE FROM roadmap_nodes 
        WHERE roadmap_id IN ${tx(duplicateSdeIds)}
      `;
      console.log(`Deleted ${deletedNodes.count} duplicate nodes.`);

      const deletedRoadmaps = await tx`
        DELETE FROM roadmaps 
        WHERE roadmap_id IN ${tx(allDuplicateRoadmapIds)}
      `;
      console.log(`Deleted ${deletedRoadmaps.count} duplicate roadmaps.`);

      // ----------------------------------------------------------------------
      // STEP 8: UPDATE CANONICAL ROADMAPS & ARCHIVE DEVOPS
      // ----------------------------------------------------------------------
      console.log('Step 8: Updating canonical roadmap records and archiving DevOps...');
      await tx`
        UPDATE roadmaps 
        SET 
          career_slug = 'sde',
          title = 'Software Development',
          career = 'Software Engineer',
          is_active = true
        WHERE roadmap_id = ${canonicalSdeId}
      `;

      await tx`
        UPDATE roadmaps 
        SET 
          career_slug = 'ai_ml',
          title = 'AI & Machine Learning',
          career = 'AI / ML Specialist',
          is_active = true
        WHERE roadmap_id = ${canonicalAimlId}
      `;

      await tx`
        UPDATE roadmaps 
        SET 
          career_slug = 'devops_archived',
          title = 'Cloud Native & DevOps Engineer Roadmap',
          career = 'DevOps Engineer',
          is_active = false
        WHERE roadmap_id = ${archivedDevopsId}
      `;
      }

      // ----------------------------------------------------------------------
      // STEP 9: INSERT REMAINING CANONICAL ROADMAPS (core, higher_ed, founder)
      // ----------------------------------------------------------------------
      console.log('Step 9: Inserting remaining canonical roadmaps (core, higher_ed, founder)...');
      const otherTracks = [
        {
          career_slug: 'core',
          title: 'Core Engineering',
          description: 'Hardware, firmware, embedded systems, IoT architecture, and robotics engineering.',
          career: 'Core Electronics / Embedded / Robotics',
          is_active: true
        },
        {
          career_slug: 'higher_ed',
          title: 'Higher Studies',
          description: 'Post-graduate and research preparations (GATE/PSU, MS Global, MBA/Tech Management).',
          career: 'Higher Studies (GATE / MS / MBA)',
          is_active: true
        },
        {
          career_slug: 'founder',
          title: 'Founder / Startup',
          description: 'Venture building, product architecture, customer discovery, legalities, and fundraising.',
          career: 'Startup Founder / Product Builder',
          is_active: true
        }
      ];

      for (const track of otherTracks) {
        const [existing] = await tx`SELECT roadmap_id FROM roadmaps WHERE career_slug = ${track.career_slug}`;
        if (!existing) {
          await tx`
            INSERT INTO roadmaps (title, description, career, career_slug, is_active)
            VALUES (${track.title}, ${track.description}, ${track.career}, ${track.career_slug}, ${track.is_active})
          `;
        }
      }

      // ----------------------------------------------------------------------
      // STEP 10: ENFORCE UNIQUE CONSTRAINT ON roadmaps.career_slug
      // ----------------------------------------------------------------------
      console.log('Step 10: Enforcing UNIQUE constraint on roadmaps.career_slug...');
      const existingConstraint = await tx`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'roadmaps' AND constraint_name = 'uq_roadmaps_career_slug'
      `;
      if (existingConstraint.length === 0) {
        await tx`ALTER TABLE roadmaps ADD CONSTRAINT uq_roadmaps_career_slug UNIQUE (career_slug)`;
      }

      // ----------------------------------------------------------------------
      // STEP 11: SEED THE 69 AUTHORITATIVE CURRICULUM NODES
      // ----------------------------------------------------------------------
      console.log('Step 11: Seeding authoritative 69 curriculum nodes...');
      const activeRoadmaps = await tx`SELECT roadmap_id, career_slug FROM roadmaps WHERE is_active = true`;
      const roadmapIdMap = {};
      activeRoadmaps.forEach(r => { roadmapIdMap[r.career_slug] = Number(r.roadmap_id); });

      console.log('Active Canonical Roadmap IDs:', roadmapIdMap);

      for (const [slug, nodes] of Object.entries(CURRICULUM)) {
        const targetRoadmapId = roadmapIdMap[slug];
        if (!targetRoadmapId) {
          throw new Error(`Missing canonical roadmap for slug: ${slug}`);
        }

        console.log(`Seeding ${nodes.length} nodes for track '${slug}' (Roadmap ID: ${targetRoadmapId})...`);

        for (const n of nodes) {
          // Check if a node with this sequence_no already exists in this roadmap
          const [existingNode] = await tx`
            SELECT node_id, sequence_no, title 
            FROM roadmap_nodes 
            WHERE roadmap_id = ${targetRoadmapId} AND sequence_no = ${n.sequence_no}
          `;

          if (existingNode) {
            // Update in-place to preserve primary key / student progress
            await tx`
              UPDATE roadmap_nodes 
              SET 
                title = ${n.title},
                description = ${n.evidence_prompt},
                node_key = ${n.node_key},
                branch_key = ${n.branch_key},
                target_semester = ${n.target_semester},
                difficulty = ${n.difficulty},
                skills = ${n.skills},
                prerequisite_keys = ${n.prerequisite_keys},
                evidence_prompt = ${n.evidence_prompt}
              WHERE node_id = ${existingNode.node_id}
            `;
          } else {
            // Insert new node
            await tx`
              INSERT INTO roadmap_nodes (
                roadmap_id, sequence_no, title, description,
                node_key, branch_key, target_semester, difficulty,
                skills, prerequisite_keys, evidence_prompt
              ) VALUES (
                ${targetRoadmapId}, ${n.sequence_no}, ${n.title}, ${n.evidence_prompt},
                ${n.node_key}, ${n.branch_key}, ${n.target_semester}, ${n.difficulty},
                ${n.skills}, ${n.prerequisite_keys}, ${n.evidence_prompt}
              )
            `;
          }
        }
      }

      // ----------------------------------------------------------------------
      // STEP 12: ENFORCE UNIQUE CONSTRAINT ON roadmap_nodes(roadmap_id, node_key)
      // ----------------------------------------------------------------------
      console.log('Step 12: Enforcing UNIQUE constraint on roadmap_nodes(roadmap_id, node_key)...');
      const existingNodeKeyConstraint = await tx`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'roadmap_nodes' AND constraint_name = 'uq_roadmap_nodes_roadmap_node_key'
      `;
      if (existingNodeKeyConstraint.length === 0) {
        await tx`ALTER TABLE roadmap_nodes ADD CONSTRAINT uq_roadmap_nodes_roadmap_node_key UNIQUE (roadmap_id, node_key)`;
      }

      // ----------------------------------------------------------------------
      // STEP 13: COMPREHENSIVE INTEGRITY ASSERTIONS
      // ----------------------------------------------------------------------
      console.log('Step 13: Executing comprehensive post-migration integrity assertions...');

      // A. Exactly 5 active roadmaps
      const [{ count: activeCount }] = await tx`SELECT count(*)::int FROM roadmaps WHERE is_active = true`;
      if (activeCount !== 5) {
        throw new Error(`Assertion failed: Expected 5 active roadmaps, found ${activeCount}`);
      }

      // B. Exactly 1 archived roadmap
      const [{ count: archivedCount }] = await tx`SELECT count(*)::int FROM roadmaps WHERE is_active = false AND career_slug = 'devops_archived'`;
      if (archivedCount !== 1) {
        throw new Error(`Assertion failed: Expected 1 archived roadmap, found ${archivedCount}`);
      }

      // C. Exactly 69 curriculum nodes on active roadmaps
      const [{ count: totalActiveNodes }] = await tx`
        SELECT count(*)::int 
        FROM roadmap_nodes rn
        JOIN roadmaps r ON rn.roadmap_id = r.roadmap_id
        WHERE r.is_active = true
      `;
      if (totalActiveNodes !== 69) {
        throw new Error(`Assertion failed: Expected 69 active curriculum nodes, found ${totalActiveNodes}`);
      }

      // D. Per-track node counts: sde=13, ai_ml=13, core=15, higher_ed=16, founder=12
      const perTrackCounts = await tx`
        SELECT r.career_slug, count(rn.node_id)::int as count
        FROM roadmaps r
        JOIN roadmap_nodes rn ON r.roadmap_id = rn.roadmap_id
        WHERE r.is_active = true
        GROUP BY r.career_slug
        ORDER BY r.career_slug
      `;
      const countMap = {};
      perTrackCounts.forEach(row => { countMap[row.career_slug] = row.count; });
      console.log('Per-track verified node counts:', countMap);

      if (countMap.sde !== 13 || countMap.ai_ml !== 13 || countMap.core !== 15 || countMap.higher_ed !== 16 || countMap.founder !== 12) {
        throw new Error(`Assertion failed on track counts: ${JSON.stringify(countMap)}`);
      }

      // E. Prerequisite key integrity: each prerequisite_keys entry must resolve within the same roadmap
      const allActiveNodes = await tx`
        SELECT rn.node_id, rn.roadmap_id, rn.node_key, rn.prerequisite_keys, r.career_slug
        FROM roadmap_nodes rn
        JOIN roadmaps r ON rn.roadmap_id = r.roadmap_id
        WHERE r.is_active = true
      `;
      const nodeKeysByRoadmap = {};
      allActiveNodes.forEach(n => {
        if (!nodeKeysByRoadmap[n.roadmap_id]) nodeKeysByRoadmap[n.roadmap_id] = new Set();
        nodeKeysByRoadmap[n.roadmap_id].add(n.node_key);
      });

      for (const n of allActiveNodes) {
        for (const prereq of n.prerequisite_keys) {
          if (!nodeKeysByRoadmap[n.roadmap_id].has(prereq)) {
            throw new Error(`Unresolvable prerequisite! Node ${n.node_key} in track ${n.career_slug} references missing key: ${prereq}`);
          }
        }
      }
      console.log('All 69 node prerequisite references verified successfully within their respective roadmaps.');

      // F. Branch vocabulary validation
      const VALID_BRANCHES = new Set(['common', 'embedded', 'iot', 'robotics', 'gate', 'ms', 'mba']);
      const invalidBranches = await tx`
        SELECT rn.node_key, rn.branch_key 
        FROM roadmap_nodes rn
        JOIN roadmaps r ON rn.roadmap_id = r.roadmap_id
        WHERE r.is_active = true AND rn.branch_key NOT IN ${tx(Array.from(VALID_BRANCHES))}
      `;
      if (invalidBranches.length > 0) {
        throw new Error(`Invalid branch_key found: ${JSON.stringify(invalidBranches)}`);
      }

      // G. Target semester range validation (1 through 8)
      const invalidSemesters = await tx`
        SELECT rn.node_key, rn.target_semester 
        FROM roadmap_nodes rn
        JOIN roadmaps r ON rn.roadmap_id = r.roadmap_id
        WHERE r.is_active = true AND (rn.target_semester < 1 OR rn.target_semester > 8 OR rn.target_semester IS NULL)
      `;
      if (invalidSemesters.length > 0) {
        throw new Error(`Invalid target_semester found: ${JSON.stringify(invalidSemesters)}`);
      }

      // H. Difficulty vocabulary validation (beginner, intermediate, advanced)
      const VALID_DIFFICULTIES = new Set(['beginner', 'intermediate', 'advanced']);
      const invalidDiffs = await tx`
        SELECT rn.node_key, rn.difficulty 
        FROM roadmap_nodes rn
        JOIN roadmaps r ON rn.roadmap_id = r.roadmap_id
        WHERE r.is_active = true AND rn.difficulty NOT IN ${tx(Array.from(VALID_DIFFICULTIES))}
      `;
      if (invalidDiffs.length > 0) {
        throw new Error(`Invalid difficulty found: ${JSON.stringify(invalidDiffs)}`);
      }

      // I. Student progress integrity: 20 total records remain, all pointing to valid canonical roadmap 1, node 1 or 2
      const postProgress = await tx`
        SELECT progress_id, user_id, roadmap_id, node_id, status 
        FROM student_roadmap_progress 
        ORDER BY progress_id
      `;
      if (postProgress.length !== 20) {
        throw new Error(`Assertion failed: Expected exactly 20 post-migration progress records, found ${postProgress.length}`);
      }

      // Verify User 3 has exactly 2 records: Node 1 'completed', Node 2 'in_progress'
      const u3Progress = postProgress.filter(p => Number(p.user_id) === 3);
      if (u3Progress.length !== 2) {
        throw new Error(`Assertion failed: Expected 2 progress records for User 3, found ${u3Progress.length}`);
      }
      const u3Node1 = u3Progress.find(p => Number(p.node_id) === 1);
      const u3Node2 = u3Progress.find(p => Number(p.node_id) === 2);
      if (!u3Node1 || u3Node1.status !== 'completed' || !u3Node2 || u3Node2.status !== 'in_progress') {
        throw new Error(`Assertion failed on User 3 progress integrity: ${JSON.stringify(u3Progress)}`);
      }

      // J. Specialization branch preservation: all existing profiles have specialization_branch IS NULL
      const nonNullBranches = await tx`
        SELECT user_id, specialization_branch 
        FROM student_profiles 
        WHERE specialization_branch IS NOT NULL
      `;
      if (nonNullBranches.length > 0) {
        throw new Error(`Assertion failed: Expected all existing student specialization_branch to be NULL, found: ${JSON.stringify(nonNullBranches)}`);
      }

      console.log('\nAll assertions passed cleanly! Committing database transaction...');
    });

    console.log('\nSUCCESS: Migration & Seeding Transaction Committed Successfully!');
  } catch (err) {
    console.error('\nERROR: Migration & Seeding failed! Transaction rolled back completely.\n', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrateAndSeed().catch(console.error);
