import React from 'react';
import { BaseControlProps } from '../types';
import { BaseControl } from './BaseControl';

export const TextNodeControl: React.FC<BaseControlProps> = ({ node, updateNodeData }) => {
  return (
    <BaseControl>
      <label className="block text-xs">
        <div className="flex flex-row gap-2">
          <span className="py-1">Text:</span>
          <input
            type="text"
            className="w-full rounded border px-1 py-1 text-xs"
            value={typeof node.data.heldText === 'string' ? node.data.heldText : ''}
            onChange={(e) => updateNodeData(node.id, { heldText: e.target.value })}
          />
        </div>
      </label>
   
      <label className="block text-xs">
        <div className="flex flex-row gap-2">
          <span className="py-1">Default:</span>
          <input
            type="text"
            className="w-full rounded border px-1 py-1 text-xs"
            value={typeof node.data.defaultText === 'string' ? node.data.defaultText : ''}
            onChange={(e) => {
              updateNodeData(node.id, { defaultText: e.target.value });
              if (!node.data.heldText) {
                updateNodeData(node.id, { heldText: e.target.value });
              }
            }}
          />
        </div>
      </label>
    </BaseControl>
  );
}; 