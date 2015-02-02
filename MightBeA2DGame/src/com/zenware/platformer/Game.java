package com.zenware.platformer;

import org.lwjgl.Sys;
import org.lwjgl.glfw.*;
import org.lwjgl.opengl.*;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.LinkedList;

import static org.lwjgl.glfw.Callbacks.*;
import static org.lwjgl.glfw.GLFW.*;
import static org.lwjgl.opengl.GL11.*;
import static org.lwjgl.system.MemoryUtil.*;

/*
 * A terribly basic 2d "platform" game that is currently only a sidescroller.
 * 
 */
public class Game {
//	private static ArrayList<Entity> gameEntities;
	// Use Lists of Entities and Foreach eval.
	private static Player player;
	private static Enemy enemy;
	private static LinkedList<Coin> coinList;

	// We need to strongly reference callback instances.
	private GLFWErrorCallback errorCallback;
	private GLFWKeyCallback keyCallback;

	// The window handle
	private long window;

	public void run() {
		System.out.println("Hello LWJGL " + Sys.getVersion() + "!");

		try {
			init();
			loop();

			// Release window and window callbacks
			glfwDestroyWindow(window);
			keyCallback.release();
		} finally {
			// Terminate GLFW and release the GLFWerrorfun
			glfwTerminate();
			errorCallback.release();
		}
	}

	private void init() {
		// Setup an error callback. The default implementation
		// will print the error message in System.err.
		glfwSetErrorCallback(errorCallback = errorCallbackPrint(System.err));

		// Initialize GLFW. Most GLFW functions will not work before doing this.
		if (glfwInit() != GL11.GL_TRUE)
			throw new IllegalStateException("Unable to initialize GLFW");

		// Configure our window
		glfwDefaultWindowHints(); // optional, the current window hints are
									// already the default
		glfwWindowHint(GLFW_VISIBLE, GL_FALSE); // the window will stay hidden
												// after creation
		glfwWindowHint(GLFW_RESIZABLE, GL_TRUE); // the window will be resizable

		int WIDTH = 800;
		int HEIGHT = 600;

		// Create the window
		window = glfwCreateWindow(WIDTH, HEIGHT, "Hello World!", NULL, NULL);
		if (window == NULL)
			throw new RuntimeException("Failed to create the GLFW window");

		// Setup a key callback. It will be called every time a key is pressed,
		// repeated or released.
		// TODO: Process Input
		glfwSetKeyCallback(window, keyCallback = new GLFWKeyCallback() {
			@Override
			public void invoke(long window, int key, int scancode, int action,
					int mods) {
				if (key == GLFW_KEY_ESCAPE && action == GLFW_RELEASE) {
					// We Will Detect this in our rendering loop
					glfwSetWindowShouldClose(window, GL_TRUE);
				}
				// Figure out some depressed action...
				if (key == GLFW_KEY_LEFT) {
					player.xspeed = Math.max(-5, player.xspeed - 1);
					player.pressingKey = true;
				}
				if (key == GLFW_KEY_RIGHT) {
					player.xspeed = Math.min(5, player.xspeed + 1);
					player.pressingKey = true;
				}
				if (key == GLFW_KEY_UP && action == GLFW_PRESS && !player.isDead()) {
					// Subtracting while comparing works just as well as
					// subtracting inside the conditional block...
					// Black Magic
					if (player.jumpsRemaining-- > 0) {
						player.yspeed = 3;
					}
					player.pressingKey = true;
				}
			}
		});

		// Get the resolution of the primary monitor
		ByteBuffer vidmode = glfwGetVideoMode(glfwGetPrimaryMonitor());
		// Center our window
		glfwSetWindowPos(window, (GLFWvidmode.width(vidmode) - WIDTH) / 2,
				(GLFWvidmode.height(vidmode) - HEIGHT) / 2);

		// Make the OpenGL context current
		glfwMakeContextCurrent(window);
		// Enable v-sync
		glfwSwapInterval(1);

		// Make the window visible
		glfwShowWindow(window);
	}

	private void loop() {
		// This line is critical for LWJGL's interoperation with GLFW's
		// OpenGL context, or any context that is managed externally.
		// LWJGL detects the context that is current in the current thread,
		// creates the ContextCapabilities instance and makes the OpenGL
		// bindings available for use.
		GLContext.createFromCurrent();
		
		double previousTime = System.currentTimeMillis();
		double lagTime = 0.0;
		double MS_PER_UPDATE = 8.0; // 120 "FPS" Cap
		// Run the rendering loop until the user has attempted to close
		// the window or has pressed the ESCAPE key.
		while (glfwWindowShouldClose(window) == GL_FALSE) {
			// TODO: Initialize some sort  of timer
			double currentTime = System.currentTimeMillis();
			double elapsedTime = currentTime - previousTime;
			previousTime = currentTime;
			lagTime += elapsedTime;
			
			// Poll for window events. The key callback above will only be
			// invoked during this call.
			glfwPollEvents(); // Process User Input
			
			while (lagTime >= MS_PER_UPDATE) {
				// Update on a fixed time step
				update();
				lagTime -= MS_PER_UPDATE;
			}
			
			// Render on a variable time step
			// Perhaps figure out some sort of interpolation
			render();
		}
	}
	
	private void update() {
//		for (Entity e : gameEntities) {
//			e.update();
//		}
		player.update(enemy);
		enemy.update(player);
		Coin tempCoin = null;
		for(Coin c : coinList ) {
			c.update();
			if (c.isOnFloor() && player.collidingWithEntity(c) && !player.isDead()) {
				player.addCoin();
				tempCoin = c;
			}
		}
		coinList.removeFirstOccurrence(tempCoin);
	}

	// TODO: IMPORTANT
	private void render() {
		setCamera();
		drawBackground();
		
		player.draw();
		enemy.draw();
		// Use this setup for all the things...
		for(Coin c : coinList)
			c.draw();
		
		// Swap the color buffers.
		glfwSwapBuffers(window);
	}
	
	public static void addCoin(Coin coin) {
		coinList.add(coin);
	}
	
	private void drawBackground() {
		
		// Sky
		glBegin(GL_QUADS);
		
		glColor3d(0.7, 0.8, 0.9);
		glVertex2d(0, 0);
		glVertex2d(800, 0);
		
		glColor3d(0.5, 0.6, 0.8);
		glVertex2d(800, 600);
		glVertex2d(0, 600);
		
		glEnd();
		
		// Ground
		glBegin(GL_QUADS);
		
		glColor3d(0.6, 0.2, 0.1);
		glVertex2d(0, 0);
		glVertex2d(800, 0);
		
		glColor3d(0.5, 0.6, 0.8);
		glVertex2d(800, 45);
		glVertex2d(0, 45);
		
		glEnd();
		
		// Grass
		// TODO: Figure out how to make this green...
		glBegin(GL_QUADS);
		
		glColor3d(0.2, 0.6, 0.1);
		glVertex2d(0, 40);
		glVertex2d(800, 40);
		
		glColor3d(0.3, 0.8, 0.2);
		glVertex2d(800, 45);
		glVertex2d(0, 45);
		
		glEnd();
	}

	private void setCamera() {
		// Clear The frame buffer
				glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
				
				// Modify Projection Matrix
				glMatrixMode(GL_PROJECTION);
				glLoadIdentity();
				glOrtho(0, 800, 0, 600, -1, 1);
				
				// Modify Modelview Matrix
				glMatrixMode(GL_MODELVIEW);
				glLoadIdentity();
	}

	public static void main(String[] args) {
		// TODO: Figure out how to use an entityList
		player = new Player();
		enemy = new Enemy();
		coinList = new LinkedList<Coin>();
		new Game().run();
	}

}