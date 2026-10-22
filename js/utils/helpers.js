function capitalize(text) {
  const words = text.split("-");
  const capitalizedWords = words.map((word) => {
    return word.slice(0, 1).toUpperCase().concat(word.slice(1));
  });

  return capitalizedWords.join(" ");
}

function debounce(callback, delay = 300) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => callback.apply(this, args), delay);
  };
}

function getTimeFromTimezone(timeZone) {
  const timezoneRegex = /([+-])(\d{1,2}):?(\d{2})?/;
  const match = timeZone.match(timezoneRegex);

  if (!match) {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
      hour12: true,
    });
  }

  const [_, sign, hours, minutes] = match;

  const offsetMultiplier =
    (sign === "+" ? 1 : -1) *
    (parseInt(hours, 10) * 60 + parseInt(minutes, 10)) *
    60 *
    1000;

  const utcTimestamp = Date.now();
  const targetDate = new Date(utcTimestamp + offsetMultiplier);

  return targetDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    hour12: true,
  });
}

export { capitalize, debounce, getTimeFromTimezone };
