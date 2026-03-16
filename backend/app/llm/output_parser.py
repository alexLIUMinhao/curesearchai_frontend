from app.schemas.chat import TaskSuggestion


def parse_chat_output(text: str) -> dict:
    optional_tasks: list[TaskSuggestion] = []
    marker = "建议任务："
    if marker in text:
        _, task_text = text.split(marker, 1)
        optional_tasks.append(TaskSuggestion(title="LLM 建议任务", description=task_text.strip()))

    return {
        "reply_text": text.strip(),
        "optional_tasks": optional_tasks,
    }

