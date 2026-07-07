import { companyMap } from "../utils/companyMap.js";

export async function companyAgent(companyName) {

    const key = companyName.toLowerCase().trim();

    return companyMap[key] || companyName;
}