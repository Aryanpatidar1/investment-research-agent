import { Annotation, StateGraph, START, END } from "@langchain/langgraph";

import { companyAgent } from "../agents/companyAgent.js";
import { financeAgent } from "../agents/financeAgent.js";
import { analyzeWithGemini } from "../services/geminiService.js";
const GraphState = Annotation.Root({
    company: Annotation(),
    ticker: Annotation(),
    financeData: Annotation(),
    analysis: Annotation(),
});
async function companyNode(state) {
    const ticker = await companyAgent(state.company);

    return {
        ...state,
        ticker
    };
}
async function financeNode(state) {
    const financeData = await financeAgent(state.ticker);

    return {
        ...state,
        financeData
    };
}
async function recommendationNode(state) {
    const analysis = await analyzeWithGemini(
        JSON.stringify(state.financeData)
    );

    return {
        ...state,
        analysis
    };
}
const workflow = new StateGraph(GraphState)
.addNode("companyNode", companyNode)
.addNode("financeNode", financeNode)
.addNode("recommendationNode", recommendationNode)

.addEdge(START, "companyNode")
.addEdge("companyNode", "financeNode")
.addEdge("financeNode", "recommendationNode")
.addEdge("recommendationNode", END);

export const investmentGraph = workflow.compile();