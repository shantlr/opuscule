import { K, createKeyTree } from './keys';

describe('hooks/api/create-key-tree', () => {
  const keyTree = createKeyTree({
    [K]: [],
    child: {
      [K]: 'child',
      grandChild: {
        [K]: 'grandChild',
      },
    },
    dyn: {
      [K]: ({ id }: { id: string }) => id,
      child: {
        [K]: ({ childId }: { childId: string }) => ['child', childId],
      },
    },
  });

  it('should compute first level key', () => {
    expect(keyTree.child({})).toEqual(['child']);
  });
  it('should compute first level dynamic key', () => {
    expect(keyTree.dyn({ id: 'id' })).toEqual(['id']);
  });
  it('should compute second level key', () => {
    expect(keyTree.child.grandChild({})).toEqual(['child', 'grandChild']);
  });
  it('should compute second level dynamic key', () => {
    expect(keyTree.dyn.child({ id: 'id', childId: 'child-123' })).toEqual([
      'id',
      'child',
      'child-123',
    ]);
  });
});
