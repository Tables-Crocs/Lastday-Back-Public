export function formatSimpleDateTime(dateTime: Date) {
  // 2012. 12. 20. 오전 3:00:00
  // const KST = dateTime - 840 * 60 * 1000;
  dateTime.setTime(dateTime.getTime() + 9 * 60 * 60 * 1000);
  const parsed = dateTime.toLocaleString('ko-KR').toString().split('. ');
  const month = parsed[1].padStart(2, '0');
  const day = parsed[2].padStart(2, '0');
  const time = parsed[3].split(':');
  const parsed_hour = time[0].split(' ');
  const hour = parsed_hour[1];
  const am_pm = parsed_hour[0] == '오전' ? 0 : 12;
  const offset = parseInt(hour) + am_pm;
  const minute = time[1].padStart(2, '0');
  return `${month}/${day} ${offset.toString().padStart(2, '0')}:${minute}`;
}

export function formatDateTime(dateTime: Date) {
  // 2012. 12. 20. 오전 3:00:00
  dateTime.setTime(dateTime.getTime() + 9 * 60 * 60 * 1000);
  const parsed = dateTime.toLocaleString('ko-KR').split('. ');
  const year = parsed[0] + '년';
  const months = parsed[1] + '월';
  const days = parsed[2] + '일';
  const parsed_time = parsed[3].split(':');
  const hour = parsed_time[0];
  const minute = parsed_time[1];
  const date = year + ' ' + months + ' ' + days + ' ';
  const time = hour + '시 ' + minute + '분';
  console.log(time);
  return {
    date: date,
    time: time,
  };
}
