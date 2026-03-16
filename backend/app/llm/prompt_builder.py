from app.models.chat_message import ChatMessage
from app.models.workflow import Workflow


def build_chat_prompt(workflow: Workflow, history: list[ChatMessage], user_message: str) -> str:
    history_text = "\n".join(f"{item.role}: {item.content}" for item in history)
    return (
        "You are a research workflow copilot.\n"
        f"Workflow: {workflow.name}\n"
        f"Stage: {workflow.stage}\n"
        f"Description: {workflow.description or 'N/A'}\n"
        "Recent conversation:\n"
        f"{history_text or 'No previous chat history.'}\n"
        "Current user message:\n"
        f"user: {user_message}"
    )


def build_chat_prompt_from_context(context_pack: dict, user_message: str, intent: str) -> str:
    workflow: Workflow = context_pack["workflow"]
    history: list[ChatMessage] = context_pack.get("history", [])
    sources: list = context_pack.get("sources", [])
    memory_summary: str = context_pack.get("memory_summary", "")
    notes_digest: str = context_pack.get("notes_digest", "")
    history_text = "\n".join(f"{item.role}: {item.content}" for item in history)

    sources_text_lines = []
    for source in sources:
        contributions = "; ".join(source.key_contributions[:2]) if source.key_contributions else "N/A"
        claims = "; ".join(source.useful_claims[:2]) if source.useful_claims else "N/A"
        sources_text_lines.extend(
            [
                f"- Source: {source.name}",
                f"  Summary: {source.summary or 'N/A'}",
                f"  Method: {source.method_overview or 'N/A'}",
                f"  Key contributions: {contributions}",
                f"  Useful claims: {claims}",
            ]
        )
    sources_text = "\n".join(sources_text_lines) if sources_text_lines else "No structured source matched for this query."

    if intent == "qa_source_summary":
        response_policy = (
            "Answer the question using the relevant structured sources first.\n"
            "If no matching source is found, explicitly say the source was not located and ask a clarifying follow-up.\n"
            "Do not invent results, metrics, or claims that are not present in context."
        )
    else:
        response_policy = (
            "Be concise, structured, and action oriented.\n"
            "Ground the reply in available context and avoid unsupported claims."
        )

    return (
        "You are a research workflow copilot.\n"
        f"Workflow context:\nName: {workflow.name}\nStage: {workflow.stage}\nDescription: {workflow.description or 'N/A'}\n\n"
        "Relevant structured sources:\n"
        f"{sources_text}\n\n"
        "Memory summary:\n"
        f"{memory_summary or 'No memory summary yet.'}\n\n"
        "Notes digest:\n"
        f"{notes_digest or 'No note digest available.'}\n\n"
        "Recent conversation:\n"
        f"{history_text or 'No previous chat history.'}\n\n"
        "Current user message:\n"
        f"user: {user_message}\n\n"
        "Response policy:\n"
        f"{response_policy}"
    )
