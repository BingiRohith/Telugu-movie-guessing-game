import type { Mode } from './rules.ts';
export interface Question {
  id: string; prompt: string; options: readonly [string, string, string, string];
  answer: number; clue: string; film: string; year: number;
  clip: { videoId: string; title: string; credit: string; source: string };
}
export const modeDetails = {
  music: { title: 'Music', numeral: '01', icon: '♬', telugu: 'సంగీతం', subtitle: 'Hear film scores and themes. Guess the movie or composer.' },
  dialogue: { title: 'Dialogue', numeral: '02', icon: '❝', telugu: 'సంభాషణ', subtitle: 'Hear movie scenes and trailers. Guess the film.' },
  song: { title: 'Song', numeral: '03', icon: '♫', telugu: 'పాట', subtitle: 'Hear hit songs. Guess the movie, singer or music director.' },
} satisfies Record<Mode, object>;
type Entry = [string, string, number, string, string, string, string, Question['options'], number, string];
function entry([id, film, year, videoId, title, credit, prompt, options, answer, clue]: Entry): Question {
  return { id, film, year, prompt, options, answer, clue, clip: { videoId, title, credit, source: 'https://www.youtube.com/watch?v=' + videoId } };
}
// Publisher embeds remain visible. No downloaded movie audio or synthetic sample fallback.
export const questions: Record<Mode, readonly Question[]> = {
  music: [
    ['salaar-score','Salaar: Part 1 – Ceasefire',2023,'Z1QuBXVrUHU','Sound of Salaar','Hombale Films · Ravi Basrur','Who composed this film score?',['Ravi Basrur','Thaman S','Devi Sri Prasad','M. M. Keeravaani'],0,'The composer also scored KGF.'],
    ['devara-score','Devara: Part 1',2024,'W1VOKBIuV7o','Devara Part 1 Original Soundtrack','T-Series Telugu · Anirudh Ravichander','Who composed this soundtrack?',['Santhosh Narayanan','Anirudh Ravichander','Ravi Basrur','Gopi Sundar'],1,'The composer also created the music of Jailer.'],
    ['baahubali-score','Baahubali: The Beginning',2015,'wLYYYTZihD8','Baahubali OST – The Saviour','Lahari Music · M. M. Keeravaani','Which film world is this score from?',['Magadheera','RRR','Baahubali','Eega'],2,'The kingdom in this story is Mahishmati.'],
    ['kalki-theme','Kalki 2898 AD',2024,'RZysj-443-8','Theme of Kalki (Telugu)','Saregama Telugu · Santhosh Narayanan','Who composed this film theme?',['A. R. Rahman','Thaman S','Anirudh Ravichander','Santhosh Narayanan'],3,'The composer also created the music of Dasara.'],
    ['og-theme','They Call Him OG',2025,'ePOglweqy7o','Hungry Cheetah – OG Glimpse','Sony Music South · Thaman S','Who composed this film theme?',['Thaman S','Mani Sharma','Ramana Gogula','Devi Sri Prasad'],0,'The composer also scored Ala Vaikunthapurramuloo.'],
  ].map(row => entry(row as Entry)),
  dialogue: [
    ['pokiri-trailer','Pokiri',2006,'rdIwjSBIW4w','Pokiri Theatrical Trailer','Puri Jagannadh · Official theatrical trailer','Which movie are these dialogues from?',['Athadu','Pokiri','Businessman','Dookudu'],1,'Mahesh Babu plays an undercover officer in this Puri Jagannadh film.'],
    ['rrr-trailer','RRR',2022,'NgBoMJy386M','RRR Trailer (Telugu)','DVV Entertainment · Telugu theatrical trailer','Which movie are these dialogues from?',['Baahubali','Sye Raa Narasimha Reddy','RRR','Magadheera'],2,'Two revolutionaries form a friendship in this Rajamouli film.'],
    ['salaar-scene','Salaar: Part 1 – Ceasefire',2023,'0ZO1fiYGCjU','Salaar Interval Scene','Hombale Films · Official interval scene','Which movie is this scene from?',['Saaho','KGF: Chapter 2','Kalki 2898 AD','Salaar'],3,'Prabhas and Prithviraj star in this Prashanth Neel film.'],
    ['pushpa-trailer','Pushpa 2: The Rule',2024,'g3JUbgOHgdw','Pushpa 2 The Rule Trailer (Telugu)','Mythri Movie Makers · Telugu theatrical trailer','Which movie are these dialogues from?',['Pushpa 2: The Rule','Pushpa: The Rise','Rangasthalam','Arya 2'],0,'Pushpa Raj returns in this Sukumar sequel.'],
    ['og-glimpse','They Call Him OG',2025,'ePOglweqy7o','Hungry Cheetah – OG Glimpse','Sony Music South · Official narrated glimpse','Which movie is this narrated glimpse from?',['Bheemla Nayak','They Call Him OG','Vakeel Saab','Gabbar Singh'],1,'Pawan Kalyan plays Ojas Gambheera in this Sujeeth film.'],
  ].map(row => entry(row as Entry)),
  song: [
    ['badri-song','Badri',2000,'9eec_n6aREE','Bangala Kathamulo','Aditya Music · Ramana Gogula','Which movie features this song?',['Kushi','Thammudu','Badri','Jalsa'],2,'Pawan Kalyan stars in Puri Jagannadh’s debut film.'],
    ['kushi-song','Kushi',2001,'9RV5WgwDvGM','Ye Mera Jaha','Aditya Music · Mani Sharma','Who composed this song?',['Devi Sri Prasad','Thaman S','Ramana Gogula','Mani Sharma'],3,'Pawan Kalyan and Bhumika star in this S. J. Suryah film.'],
    ['magadheera-song','Magadheera',2009,'qTE453yc1rc','Panchadara Bomma','Geetha Arts · M. M. Keeravaani','Which movie features this song?',['Magadheera','Orange','Chirutha','Racha'],0,'Ram Charan and Kajal star in this reincarnation story.'],
    ['butta-bomma','Ala Vaikunthapurramuloo',2020,'2mDCVzruYzQ','Butta Bomma','Aditya Music · Thaman S · Armaan Malik','Who sings this song?',['Sid Sriram','Armaan Malik','Anurag Kulkarni','Rahul Sipligunj'],1,'This singer also performs the Telugu song Anaganaganaga.'],
    ['naatu-naatu','RRR',2022,'4_eEgJhsBMo','Naatu Naatu (Telugu)','T-Series Telugu / Lahari Music · M. M. Keeravaani','Who composed this song?',['Devi Sri Prasad','Thaman S','M. M. Keeravaani','Mani Sharma'],2,'This song won the Academy Award for Best Original Song.'],
    ['daavudi','Devara: Part 1',2024,'QQwDeJFSVvc','Daavudi','T-Series Telugu · Anirudh Ravichander','Which movie features this song?',['RRR','Janatha Garage','Aravinda Sametha','Devara: Part 1'],3,'NTR and Janhvi Kapoor feature in this dance number.'],
    ['chikiri-chikiri','Peddi',2026,'RyzPweJKJ9M','Chikiri Chikiri','T-Series Telugu · A. R. Rahman · Mohit Chauhan','Who sings this song?',['Mohit Chauhan','Sid Sriram','Vishal Mishra','Armaan Malik'],0,'This singer is also known for the Hindi song Tum Se Hi.'],
    ['kalki-song','Kalki 2898 AD',2024,'RZysj-443-8','Theme of Kalki (Telugu)','Saregama Telugu · Santhosh Narayanan','Which movie features this theme song?',['Devara: Part 1','Kalki 2898 AD','Salaar','Hanu-Man'],1,'Nag Ashwin directs this futuristic film featuring Bhairava.'],
  ].map(row => entry(row as Entry)),
};
export function selectQuestions(mode: Mode, random: () => number = Math.random): Question[] {
  const pool = [...questions[mode]];
  for (let index = pool.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [pool[index], pool[other]] = [pool[other], pool[index]];
  }
  return pool.slice(0, 5);
}
