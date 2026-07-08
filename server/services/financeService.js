import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

function generateRandomIp() {
  return `${Math.floor(Math.random() * 220) + 1}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
}

export async function getCompanyFinancials(company) {
  try {
    const randomIp = generateRandomIp();
    const result = await yahooFinance.quote(
      company,
      {},
      {
        fetchOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "X-Forwarded-For": randomIp,
            "Client-IP": randomIp
          }
        }
      }
    );

    return {
      symbol: result.symbol,
      companyName: result.longName || company.toUpperCase(),
      marketCap: result.marketCap,
      currentPrice: result.regularMarketPrice,
      peRatio: result.trailingPE,
      eps: result.epsTrailingTwelveMonths,
      dividendYield: result.dividendYield,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow,
    };
  } catch (error) {
    console.error("Yahoo Finance Quote API Error:", error.message || error);
    return null;
  }
}