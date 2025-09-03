import * as THREE from 'three';
import {
  ConnectionManager,
  CubeInstance,
  Connection,
} from './interfaces';

/**
 * Connection manager using a simple spatial grid for proximity checks.
 */
export class SpatialConnectionManager implements ConnectionManager {
  private connections = new Map<string, Connection>();
  private cellSize: number;
  private distanceThreshold: number;

  constructor(cellSize = 3, distanceThreshold = 2.5) {
    this.cellSize = cellSize;
    this.distanceThreshold = distanceThreshold;
  }

  /**
   * Iterate through cubes indexed by ID and create/remove connections
   * depending on their spatial proximity. A spatial grid reduces the
   * number of pairwise checks needed compared to a naive O(n^2) loop.
   */
  updateConnections(cubes: Map<string, CubeInstance>): void {
    const grid = new Map<string, Set<string>>();

    // Index cubes into grid cells
    for (const [id, cube] of cubes) {
      const key = this.cellKey(cube.transform.position);
      let bucket = grid.get(key);
      if (!bucket) {
        bucket = new Set();
        grid.set(key, bucket);
      }
      bucket.add(id);
    }

    const active = new Set<string>();

    // Check each cube against neighbours in adjacent cells
    for (const [id, cube] of cubes) {
      const { x, y, z } = this.cellCoords(cube.transform.position);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dz = -1; dz <= 1; dz++) {
            const key = this.cellKeyFromCoords(x + dx, y + dy, z + dz);
            const bucket = grid.get(key);
            if (!bucket) continue;
            for (const otherId of bucket) {
              if (otherId <= id) continue; // avoid duplicate pairs
              const other = cubes.get(otherId);
              if (other && this.checkProximity(cube, other)) {
                const connId = this.connKey(id, otherId);
                if (!this.connections.has(connId)) {
                  this.connections.set(connId, this.createConnection(id, otherId));
                }
                active.add(connId);
              }
            }
          }
        }
      }
    }

    // Remove connections that are no longer active
    for (const connId of Array.from(this.connections.keys())) {
      if (!active.has(connId)) this.removeConnection(connId);
    }
  }

  /** Determine if two cubes are within the connection threshold. */
  checkProximity(cube1: CubeInstance, cube2: CubeInstance): boolean {
    return cube1.transform.position.distanceTo(cube2.transform.position) < this.distanceThreshold;
  }

  /** Create a connection instance. */
  createConnection(fromId: string, toId: string): Connection {
    const id = this.connKey(fromId, toId);
    return {
      id,
      fromCubeId: fromId,
      toCubeId: toId,
      strength: 1,
      isActive: true,
    };
  }

  /** Remove connection from internal storage. */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /** Retrieve all current connections. */
  getConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  /** Ensure that the proposed connection is valid. */
  validateConnection(fromId: string, toId: string): boolean {
    if (fromId === toId) return false;
    const key = this.connKey(fromId, toId);
    return !this.connections.has(key);
  }

  /** Detect cycles in the directed connection graph. */
  detectCycles(connections: Connection[]): boolean {
    const adj = new Map<string, string[]>();
    for (const c of connections) {
      if (!adj.has(c.fromCubeId)) adj.set(c.fromCubeId, []);
      adj.get(c.fromCubeId)!.push(c.toCubeId);
    }

    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (stack.has(node)) return true;
      if (visited.has(node)) return false;
      visited.add(node);
      stack.add(node);
      for (const nb of adj.get(node) || []) {
        if (dfs(nb)) return true;
      }
      stack.delete(node);
      return false;
    };

    for (const node of adj.keys()) {
      if (dfs(node)) return true;
    }
    return false;
  }

  private cellKey(position: THREE.Vector3): string {
    const { x, y, z } = this.cellCoords(position);
    return this.cellKeyFromCoords(x, y, z);
  }

  private cellCoords(position: THREE.Vector3): { x: number; y: number; z: number } {
    return {
      x: Math.floor(position.x / this.cellSize),
      y: Math.floor(position.y / this.cellSize),
      z: Math.floor(position.z / this.cellSize),
    };
  }

  private cellKeyFromCoords(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private connKey(a: string, b: string): string {
    return [a, b].sort().join('->');
  }
}

export default SpatialConnectionManager;
