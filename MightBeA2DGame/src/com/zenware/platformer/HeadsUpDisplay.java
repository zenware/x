package com.zenware.platformer;

import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.nio.ByteBuffer;

import org.lwjgl.BufferUtils;
import org.lwjgl.opengl.GL11;

public class HeadsUpDisplay {
	Font font;
	String text;
	int s; // size
	ByteBuffer pixels;

	HeadsUpDisplay() {
		font = new Font("Times New Roman", Font.BOLD, 24);
		s = 256;
	}
	
	private void createPixelData() {
		BufferedImage b = new BufferedImage(s, s, BufferedImage.TYPE_4BYTE_ABGR);
		Graphics2D g = b.createGraphics();
		g.drawString(text, 0, 0);
		
		int co  = b.getColorModel().getNumComponents();
		
		byte[] data = new byte[co * s * s];
		b.getRaster().getDataElements(0,  0, s, s, data);
		
		pixels = BufferUtils.createByteBuffer(data.length);
		pixels.put(data);
		pixels.rewind();
	}
	
	public void update() {
		
	}
	
	public void render() {
		
		
		GL11.glTexImage2D(0, 0, 0, 0, 0, 0, 0, 0, pixels);
	}
}
