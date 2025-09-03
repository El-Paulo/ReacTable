import {
  AudioEngine,
  AudioParams,
  CubeType,
} from './core/interfaces';

export class WebAudioEngine implements AudioEngine {
  private ctx?: AudioContext;
  private nodes = new Map<string, AudioNode>();
  private recorder?: MediaRecorder;
  private chunks: BlobPart[] = [];

  async initialize(): Promise<void> {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async start(): Promise<void> {
    await this.ctx?.resume();
  }

  async stop(): Promise<void> {
    await this.ctx?.suspend();
  }

  createAudioNode(type: CubeType, params: AudioParams): AudioNode {
    if (!this.ctx) throw new Error('Audio context not initialized');
    const id = Math.random().toString(36).slice(2);
    let node: AudioNode;
    switch (type) {
      case CubeType.OSCILLATOR: {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        if (params.frequency) osc.frequency.value = params.frequency;
        gain.gain.value = params.gain ?? 0.2;
        osc.connect(gain);
        osc.start();
        node = gain;
        break;
      }
      case CubeType.FILTER: {
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = params.frequency ?? 1000;
        node = filter;
        break;
      }
      case CubeType.GAIN:
      case CubeType.OUTPUT:
      default: {
        const gain = this.ctx.createGain();
        gain.gain.value = params.gain ?? 1;
        node = gain;
        break;
      }
    }
    (node as any).__id = id;
    this.nodes.set(id, node);
    return node;
  }

  updateAudioNode(nodeId: string, params: AudioParams): void {
    const node = this.nodes.get(nodeId) as any;
    if (!node) return;
    Object.entries(params).forEach(([key, value]) => {
      if (node[key] && typeof node[key].value === 'number') {
        node[key].value = value;
      }
    });
  }

  removeAudioNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    try {
      (node as any).disconnect();
    } catch {
      /* noop */
    }
    this.nodes.delete(nodeId);
  }

  connectNodes(fromId: string, toId: string): void {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (from && to) from.connect(to);
  }

  disconnectNodes(fromId: string, toId: string): void {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (from && to) {
      try {
        from.disconnect(to);
      } catch {
        /* noop */
      }
    }
  }

  startRecording(): void {
    if (!this.ctx) return;
    const dest = this.ctx.createMediaStreamDestination();
    this.nodes.forEach((n) => n.connect(dest));
    this.recorder = new MediaRecorder(dest.stream);
    this.chunks = [];
    this.recorder.ondataavailable = (e) => this.chunks.push(e.data);
    this.recorder.start();
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(new Blob());
        return;
      }
      this.recorder.onstop = () => {
        resolve(new Blob(this.chunks, { type: 'audio/webm' }));
      };
      this.recorder.stop();
    });
  }

  getLatency(): number {
    return this.ctx?.baseLatency ?? 0;
  }

  getCPUUsage(): number {
    return 0;
  }
}
