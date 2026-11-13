import type { Resource, ResourceData, ResourceKind } from "./resource.js";

type Item<K extends ResourceKind> = Omit<
  Extract<ResourceData, { kind: K }>,
  "kind"
>;

export interface ResourceLists {
  environments: Item<"environment">[];
  personas: Item<"persona">[];
  skills: Item<"skill">[];
  mcps: Item<"mcp">[];
}

export abstract class ResourceRepository {
  abstract list(): Promise<ResourceLists>;
  abstract save(resource: Resource): Promise<void>;
  abstract delete(kind: ResourceKind, id: string): Promise<unknown>;
}
