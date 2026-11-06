# src/alpha_crew/main.py
from dotenv import load_dotenv

def run():
    load_dotenv()
    # Setup and trigger the crew
    crew = crew()
    crew.agent_function()
    crew.task_function()

if __name__ == "__main__":
    run()
