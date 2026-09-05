import assert from 'node:assert/strict';
import { createDemoTemplateStore } from './demoTemplateStore';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const store = createDemoTemplateStore(new MemoryStorage());
const templates = store.listTemplates();

assert.equal(templates.length, 3);
assert.ok(templates.every((template) => template.isSystem));
assert.deepEqual(
  templates.map((template) => template.name),
  ['Welcome email', 'Order confirmation', 'Password reset'],
);
