import { setTimeout } from 'node:timers/promises';

const smartMemoryLeak = new WeakMap();

export function runSmartMemoryLeakTask() {
  for (let i = 0; i < 10000; i++) {
    const person = {
      name: `Person number ${i}`,
      age: i
    };
    smartMemoryLeak.set(person, `I am a person number ${i}`);
  }
}

while (true) {
  await setTimeout(1000);

  runSmartMemoryLeakTask();
}
