package com.zenware.platformer;

public class Entity {
	public double x, y, xspeed, yspeed;
	
	public void update() {
		//Intentionally Overridden.
	}
	
	public boolean collidingWithEntity(Entity entity) {
		if (Math.abs(x - entity.x) > 16 || Math.abs(y - entity.y) > 16) {
			return false;
		} else {
			System.out.println("Bump");
			return true;
		}
	}

	public boolean isOnFloor() {
		if (y <= 45) {
			return true;
		} else {
			return false;
		}
	}
	
	void wrapScreen() {
		if (x > 800)
			x = 1;
		if (x < 0)
			x = 799;
	}
	
}
