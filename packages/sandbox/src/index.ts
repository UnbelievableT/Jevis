export interface SandboxCapabilities {
  filesystem: boolean;
  network: boolean;
  process: boolean;
  platform: string;
  verified: boolean;
}
export interface SandboxDriver {
  id: string;
  probe(): Promise<SandboxCapabilities>;
  run(input: {
    executable: string;
    args: string[];
    cwd: string;
    readRoots: string[];
    writeRoots: string[];
    networkHosts: string[];
    signal: AbortSignal;
  }): Promise<{ exitCode: number; stdoutRef: string; stderrRef: string }>;
}
export class UnconfiguredSandbox implements SandboxDriver {
  id = 'unconfigured';
  async probe(): Promise<SandboxCapabilities> {
    return {
      filesystem: false,
      network: false,
      process: false,
      platform: process.platform,
      verified: false,
    };
  }
  async run(): Promise<never> {
    throw new Error('No verified sandbox driver is installed. Host execution is disabled.');
  }
}
