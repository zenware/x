package com.zenware.platformer;

import static org.lwjgl.opengl.GL11.*;

public class Player extends Character {
	public boolean pressingKey;
	public int jumpsRemaining;
	
	public Player() {
		x = 100;
		y = 100;
		xspeed = 1;
		dead = false;
	}
	
	public void addCoin() {
		coins += 1;
		System.out.println("Adding a coin, Total coins: " + coins);
	}
	
	public void subCoin() {
		coins -= 1;
	}
	
	// TODO: Figure out how to move performance critical input to this area.
	@Override
	public void update(Character enemy) {
		// Move the player
		x += xspeed;
		y += yspeed;
		
		yspeed -= 0.05;
		
		wrapScreen();
		if (isDead()) {			
			if (y < -500) {
				dead = false;
			}
			return;
		}
		
		if (isOnFloor()) {
			yspeed = 0;
			y = 45;
			
			// Still need to figure this thing out.
			if (!pressingKey && xspeed != 0) {
				xspeed *= 0.95;
			}
			
			jumpsRemaining = 2;
		}
		
		if (collidingWithEntity(enemy) && yspeed < 0) {
			killCharacter(enemy);
		}
		
		pressingKey = false;
	}
	
	@Override
	public boolean isEnemy() {
		return false;
	}
	
	public void draw()
	{
		glPushMatrix();
		glTranslated(x, y, 0);
		glBegin(GL_QUADS);
		
		glColor3d(1, 0, 0);
		glVertex2d(-8, 0);
		
		glColor3d(0, 1, 0);
		glVertex2d(8, 0);
		
		glColor3d(0, 0, 1);
		glVertex2d(8, 16);
		
		glColor3d(1, 1, 0);
		glVertex2d(-8, 16);
		
		glEnd();
		glPopMatrix();
	}
}