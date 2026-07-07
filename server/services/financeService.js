import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export async function getCompanyFinancials(company) {
  try {
    const result = await yahooFinance.quote(company);

    return {
      symbol: result.symbol,
      companyName: result.longName,
      marketCap: result.marketCap,
      currentPrice: result.regularMarketPrice,
      peRatio: result.trailingPE,
      eps: result.epsTrailingTwelveMonths,
      dividendYield: result.dividendYield,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}