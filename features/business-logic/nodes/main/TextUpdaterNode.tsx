import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
 
const handleStyle = { left: 10, backgroundColor: 'red', width: '10px', height: '10px', borderRadius: '30%' };
 
function TextUpdaterNode({ data }: { data: number }) {
  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className=" h-[50px] border p-5 rounded-md bg-black">
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag bg-amber-50 text-black" />
      </div>
      <Handle type="source" position={Position.Bottom} id="a"/>
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} className="">

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]">  
                <p>{"{}"}</p>
            </div>
      </Handle>
    </div>
  );
}

export default TextUpdaterNode;