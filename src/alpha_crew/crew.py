# src/alpha_crew/crew.py
class AlphaCrewBase:
    agents_config = "config/agents.yml"
    tasks_config = "config/tasks.yml"

    @staticmethod
    def agent_function():
        pass

    @staticmethod
    def task_function():
        pass

def crew():
    return AlphaCrewBase
