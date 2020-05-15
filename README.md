# FREKVENS Video Encoder

Run the frames-to-csv.toe in TouchDesigner, with a video of your choice. It will dump frames in CSV format into the frames folder.

Next, run the encode.js script to encode the frames into "FREKVENS Frames" format (see below).

```
node encode
```

## FREKVENS Frames

I made up this simple binary format to make the encoding/decoding process more robust and easier to troubleshoot.

Looks something like this when dumped:

```
00000000  46 52 46 52 00 00 00 01  1a 24 00 00 01 00 00 00  |FRFR.....$......|
00000010  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00000020  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00000030  02 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
00000040  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|
...
```

## Header

* 4 bytes: "FRFR" that stand for "FRekvens FRames".
* 4 bytes: The version number. First byte is unused. The rest are the major, minor and patch versions, a la semantic versioning. The example above is `[0x00, 0x00, 0x00, 0x01]`, meaning version 0.0.1.
* 4 bytes: Number of frames. 32-bit unsigned integer in little-endian. The example above is `[0x1a, 0x24, 0x00, 0x00]`, meaning 9242 frames.

## Frame data

Repeats until the end of the file (or the number of frames declared in the header are found):

* 4 bytes: The frame number, starting from 1. This is the same as the number in the original CSV file name. 32-bit unsigned integer in little-endian.
* 32 bytes: The frame data. Each row is a 16-bit unsigned integer in little-endian. The 16 pixels of the row are packed into this integer as bits. Test individual bits to read the pixels.
