import os
import struct
import glob

temp_dir = r"C:\Users\Vignesh_Murugan\AppData\Local\Temp"

files = glob.glob(os.path.join(temp_dir, "**/sketch.ino.merged.bin"), recursive=True)
if not files:
    print("Could not find any sketch.ino.merged.bin")
    exit(1)

files.sort(key=os.path.getmtime, reverse=True)
bin_file = files[0]
print(f"Inspecting bin file: {bin_file}")

with open(bin_file, "rb") as f:
    data = f.read()

offset = 0x10000
seg_count = data[offset + 1]
extended_header = data[offset + 8] == 0xEE
header_size = 24 if extended_header else 8
ptr = offset + header_size

segment_data = None
segment_load_addr = None

for s in range(seg_count):
    load_addr, seg_size = struct.unpack("<II", data[ptr:ptr+8])
    ptr += 8
    seg_bytes = data[ptr:ptr+seg_size]
    ptr += seg_size
    
    if load_addr <= 0x40386b44 < load_addr + seg_size:
        segment_data = seg_bytes
        segment_load_addr = load_addr
        break

if segment_data is None:
    print("Could not find segment containing 0x40386b44")
    exit(1)

start_pc = 0x40386b44
offset_in_seg = start_pc - segment_load_addr

print(f"Dump of instructions starting at PC=0x{start_pc:08x}:")
i = offset_in_seg
while i < offset_in_seg + 100 and i < len(segment_data):
    addr = segment_load_addr + i
    # read 16 bits
    raw16 = struct.unpack("<H", segment_data[i:i+2])[0]
    
    if (raw16 & 0x3) != 0x3:
        # compressed
        print(f"  0x{addr:08x}: 0x{raw16:04x} (compressed)")
        i += 2
    else:
        # 32-bit
        raw32 = struct.unpack("<I", segment_data[i:i+4])[0]
        print(f"  0x{addr:08x}: 0x{raw32:08x}")
        i += 4
