import { useCallback } from 'react';
import { Position } from '@xyflow/react';
import CustomHandle from '../../handles/CustomHandle';
 
const handleStyle = { left: 10, backgroundColor: 'red', width: '10px', height: '10px', borderRadius: '30%' };
 
function TextUpdaterNode({ data }: { data: number }) {
  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    console.log(evt.target.value);
  }, []);
 
  return (
    <div className=" h-[50px] border p-5 rounded-md bg-black">
      {/* INPUT HANDLE (top, number, id and dataType = 'n') */}
      <CustomHandle type="target" position={Position.Top} id="n" dataType="n" />
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag bg-amber-50 text-black" />
      </div>
      {/* OUTPUT HANDLE (bottom, number, id and dataType = 'n') */}
      <CustomHandle type="source" position={Position.Bottom} id="n" dataType="n" />
      {/* Example for union: id="n|b" dataType="n" */}
      {/* <CustomHandle type="source" position={Position.Bottom} id="n|b" dataType="n" /> */}
      {/* Example for any: id="x" dataType="x" /> */}
      {/* Example for custom: id="customType" dataType="customType" /> */}
      <CustomHandle type="source" position={Position.Bottom} id="n" dataType="n" style={handleStyle} className="">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px]">  
          <p>{"{}"}</p>
        </div>
      </CustomHandle>
    </div>
  );
}

export default TextUpdaterNode;