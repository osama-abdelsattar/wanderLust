function checkWeatherCondition(weatherCode) {
  switch (weatherCode) {
    case 0:
      return "Clear sky";
    case 1:
      return "Mainly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
      return "Fog";
    case 48:
      return "Depositing rime fog";
    case 51:
      return "Light drizzle";
    case 53:
      return "Moderate drizzle";
    case 55:
      return "Dense drizzle";
    case 61:
      return "Slight rain";
    case 63:
      return "Moderate rain";
    case 65:
      return "Heavy rain";
    case 71:
      return "Slight snowfall";
    case 73:
      return "Moderate snowfall";
    case 75:
      return "Heavy snowfall";
    case 80:
      return "Slight rain showers";
    case 81:
      return "Moderate rain showers";
    case 82:
      return "Violent rain showers";
    case 95:
      return "Slight thunderstorm";
    case 96:
      return "Moderate thunderstorm";
    case 99:
      return "Moderate thunderstorm with hail";
  }
}

function checkWeatherClass(weatherCode) {
  if (weatherCode === 0) return "sunny";
  else if ([1, 2, 3].includes(weatherCode)) return "cloudy";
  else if ([45, 48].includes(weatherCode)) return "foggy";
  else if ([51, 53, 55, 61, 62, 63, 65, 80, 81, 82].includes(weatherCode))
    return "rainy";
  else if ([71, 73, 75].includes(weatherCode)) return "snowy";
  else if ([95, 96, 99].includes(weatherCode)) return "stormy";
  else return "default";
}

function checkWeatherIcon(weatherCode) {
  if (weatherCode === 0) return "sun";
  else if ([1, 2].includes(weatherCode)) return "cloud-sun";
  else if ([3, 66].includes(weatherCode)) return "cloud";
  else if ([45, 48].includes(weatherCode)) return "smog";
  else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode))
    return "cloud-showers-heavy";
  else if ([71, 73, 75].includes(weatherCode)) return "snowflake";
  else if ([95, 96, 99].includes(weatherCode)) return "cloud-bolt";
}

function getWindDirection(degrees) {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;

  return directions[index];
}

function getSunPosition(sunriseISO, sunsetISO) {
  const now = new Date();
  const sunrise = new Date(sunriseISO);
  const sunset = new Date(sunsetISO);

  if (now < sunrise) return "0";
  if (now > sunset) return "100";

  const totalDaylight = sunset - sunrise;
  const elapsedTime = now - sunrise;
  const percentage = (elapsedTime / totalDaylight) * 100;

  return percentage;
}

export {
  checkWeatherCondition,
  checkWeatherClass,
  checkWeatherIcon,
  getWindDirection,
  getSunPosition,
};
