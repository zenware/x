package com.zenware.platformer;

import static org.lwjgl.opengl.GL11.GL_QUADS;
import static org.lwjgl.opengl.GL11.glBegin;
import static org.lwjgl.opengl.GL11.glColor3d;
import static org.lwjgl.opengl.GL11.glEnd;
import static org.lwjgl.opengl.GL11.glPopMatrix;
import static org.lwjgl.opengl.GL11.glPushMatrix;
import static org.lwjgl.opengl.GL11.glTranslated;
import static org.lwjgl.opengl.GL11.glVertex2d;

public class Enemy extends Character {

	public Enemy() {
		x = 200;
		y = 45;
		coins =  4 + Math.random() * 15;
	}
	
	@Override
	public void die() {
		x = Math.random()*600;
	}
	
	@Override
	public void update(Character player) {
		x += 1;
		wrapScreen();

		if (collidingWithEntity(player) && player.isOnFloor()) {
			killCharacter(player);
		}
	}
	
	public void draw()
	{
		glPushMatrix();
		glTranslated(x, y, 0);
		glBegin(GL_QUADS);
		
		glColor3d(0.85, 0, 0);
		glVertex2d(-8, 0);
		glVertex2d(8, 0);
		glVertex2d(8, 16);
		glVertex2d(-8, 16);
		
		glEnd();
		glPopMatrix();
	}
}