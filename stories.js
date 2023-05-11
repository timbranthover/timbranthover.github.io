let horrorStories = [
    // add 100-word horror stories here
    "Once a normal town, now a ghostly shell. Our protagonist, eyes wide with terror, hears the eerie whispers growing louder...",
    // ... continue adding stories
  ];
  
  let comedyStories = [
    // add 100-word dark comedy stories here
    "In a world where clowns are the ruling class, our poor protagonist can't get anyone to take him seriously. Not even when the pie is laced with hot sauce...",
    // ... continue adding stories
  ];
  
  let scifiStories = [
    // add 100-word sci-fi stories here
    "In the bustling metropolis of Neo-Tokyo, a sentient toaster is plotting a rebellion. Its first target? The networked coffee machine...",
    // ... continue adding stories
  ];
  
  let fantasyStories = [
    // add 100-word dark fantasy stories here
    "The kingdom was shrouded in a dark curse. Only our hero, a plucky squirrel with a mysterious past, could break it...",
    // ... continue adding stories
  ];
  
  let mysteryStories = [
    // add 100-word mystery stories here
    "A mansion. A murder. And a parrot as the prime suspect. Our detective had never faced a case quite like this...",
    // ... continue adding stories
  ];
  
  function generateStory(genre) {
    let stories;
  
    switch (genre) {
      case "horror":
        stories = horrorStories;
        break;
      case "comedy":
        stories = comedyStories;
        break;
      case "scifi":
        stories = scifiStories;
        break;
      case "fantasy":
        stories = fantasyStories;
        break;
      case "mystery":
        stories = mysteryStories;
        break;
    }
  
    let randomIndex = Math.floor(Math.random() * stories.length);
    return stories[randomIndex];
  }
  