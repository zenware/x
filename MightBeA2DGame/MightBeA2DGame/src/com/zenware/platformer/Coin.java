package com.zenware.platformer;

import static org.lwjgl.opengl.GL11.GL_QUADS;
import static org.lwjgl.opengl.GL11.glBegin;
import static org.lwjgl.opengl.GL11.glColor3d;
import static org.lwjgl.opengl.GL11.glEnd;
import static org.lwjgl.opengl.GL11.glPopMatrix;
import static org.lwjgl.opengl.GL11.glPushMatrix;
import static org.lwjgl.opengl.GL11.glTranslated;
import static org.lwjgl.opengl.GL11.glVertex2d;

public class Coin extends Entity {
	
	Coin(double _x, double _y) {
		x = _x;
		y = _y;
		
		yspeed = 7 + Math.random() * 12;
		xspeed = 5 * ((Math.random() * 2) - 1);
	}
	
	@Override
	public void update() {
		x += xspeed;
		y += yspeed;
		
		yspeed -= 0.3;
		xspeed *= 0.95;
		wrapScreen();
		
		if (isOnFloor()) {
			yspeed = 0;
			y = 45;
		}
//		
//		if (collidingWithEntity(player) && !player.isDead() && !player.isEnemy()) {
//			player.addCoin();
//		}

	}
	
	public void draw() {
		glPushMatrix();
		glTranslated(x, y, 0);
		glBegin(GL_QUADS);
		
		glColor3d(1, 1, 0);
		glVertex2d(-4, 0);
		glVertex2d(4, 0);
		glVertex2d(4, 8);
		glVertex2d(-4, 8);
		
		glEnd();
		glPopMatrix();
	}
}
