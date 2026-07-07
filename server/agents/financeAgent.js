import { getCompanyFinancials } from "../services/financeService.js";

export async function financeAgent(company) {
  const financialData = await getCompanyFinancials(company);

  return financialData;
}