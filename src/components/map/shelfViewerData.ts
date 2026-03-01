import type { ShelfNodeData, ShelfBookDetail, ShelfTierData, BookStatus } from "./types";

interface BookTemplate {
  title: string;
  author: string;
  isbn: string;
  dewey: string;
}

const BOOK_CATALOG: Record<string, BookTemplate[]> = {
  Fiction: [
    { title: "Pride and Prejudice", author: "Jane Austen", isbn: "978-0141439518", dewey: "823.7" },
    { title: "1984", author: "George Orwell", isbn: "978-0451524935", dewey: "823.912" },
    { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "978-0060935467", dewey: "813.54" },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "978-0743273565", dewey: "813.52" },
    { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "978-0141441146", dewey: "823.8" },
    { title: "Brave New World", author: "Aldous Huxley", isbn: "978-0060850524", dewey: "823.912" },
    { title: "Wuthering Heights", author: "Emily Brontë", isbn: "978-0141439556", dewey: "823.8" },
    { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "978-0316769488", dewey: "813.54" },
    { title: "Moby Dick", author: "Herman Melville", isbn: "978-0142437247", dewey: "813.3" },
    { title: "Fahrenheit 451", author: "Ray Bradbury", isbn: "978-1451673319", dewey: "813.54" },
    { title: "The Road", author: "Cormac McCarthy", isbn: "978-0307387899", dewey: "813.54" },
    { title: "Beloved", author: "Toni Morrison", isbn: "978-1400033416", dewey: "813.54" },
    { title: "Dune", author: "Frank Herbert", isbn: "978-0441172719", dewey: "813.54" },
    { title: "Catch-22", author: "Joseph Heller", isbn: "978-1451626650", dewey: "813.54" },
    { title: "Slaughterhouse-Five", author: "Kurt Vonnegut", isbn: "978-0385333481", dewey: "813.54" },
  ],
  "Non-Fiction": [
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "978-0062316097", dewey: "909" },
    { title: "Educated", author: "Tara Westover", isbn: "978-0399590504", dewey: "921" },
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0374533557", dewey: "153.4" },
    { title: "The Power of Habit", author: "Charles Duhigg", isbn: "978-0812981605", dewey: "158.1" },
    { title: "Atomic Habits", author: "James Clear", isbn: "978-0735211292", dewey: "158.1" },
    { title: "Becoming", author: "Michelle Obama", isbn: "978-1524763138", dewey: "921" },
    { title: "Outliers", author: "Malcolm Gladwell", isbn: "978-0316017930", dewey: "302" },
    { title: "Quiet", author: "Susan Cain", isbn: "978-0307352156", dewey: "155.2" },
    { title: "The Body", author: "Bill Bryson", isbn: "978-0385539302", dewey: "612" },
    { title: "Born a Crime", author: "Trevor Noah", isbn: "978-0399588181", dewey: "921" },
    { title: "Bad Blood", author: "John Carreyrou", isbn: "978-1524731656", dewey: "338.7" },
    { title: "Freakonomics", author: "Steven Levitt", isbn: "978-0060731335", dewey: "330" },
    { title: "Guns, Germs, and Steel", author: "Jared Diamond", isbn: "978-0393354324", dewey: "303.4" },
    { title: "Meditations", author: "Marcus Aurelius", isbn: "978-0140449334", dewey: "188" },
    { title: "The Art of War", author: "Sun Tzu", isbn: "978-1590302255", dewey: "355.02" },
  ],
  Science: [
    { title: "A Brief History of Time", author: "Stephen Hawking", isbn: "978-0553380163", dewey: "523.1" },
    { title: "The Selfish Gene", author: "Richard Dawkins", isbn: "978-0198788607", dewey: "576.5" },
    { title: "Cosmos", author: "Carl Sagan", isbn: "978-0345539434", dewey: "520" },
    { title: "The Origin of Species", author: "Charles Darwin", isbn: "978-0451529060", dewey: "576.8" },
    { title: "Silent Spring", author: "Rachel Carson", isbn: "978-0618249060", dewey: "574.5" },
    { title: "The Double Helix", author: "James Watson", isbn: "978-0743216302", dewey: "572.8" },
    { title: "The Elegant Universe", author: "Brian Greene", isbn: "978-0393338102", dewey: "539.7" },
    { title: "The Gene", author: "Siddhartha Mukherjee", isbn: "978-1476733524", dewey: "576.5" },
    { title: "Astrophysics for People in a Hurry", author: "Neil deGrasse Tyson", isbn: "978-0393609394", dewey: "523.01" },
    { title: "Periodic Tales", author: "Hugh Aldersey-Williams", isbn: "978-0061824739", dewey: "546" },
    { title: "Lab Girl", author: "Hope Jahren", isbn: "978-1101874936", dewey: "580" },
    { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", isbn: "978-1400052189", dewey: "571.6" },
    { title: "Relativity", author: "Albert Einstein", isbn: "978-1891396304", dewey: "530.11" },
    { title: "What If?", author: "Randall Munroe", isbn: "978-0544272996", dewey: "500" },
    { title: "The Structure of Scientific Revolutions", author: "Thomas Kuhn", isbn: "978-0226458120", dewey: "501" },
  ],
  History: [
    { title: "A People's History of the US", author: "Howard Zinn", isbn: "978-0060838652", dewey: "973" },
    { title: "The Diary of a Young Girl", author: "Anne Frank", isbn: "978-0553296983", dewey: "940.53" },
    { title: "Team of Rivals", author: "Doris Kearns Goodwin", isbn: "978-0743270755", dewey: "973.7" },
    { title: "1776", author: "David McCullough", isbn: "978-0743226721", dewey: "973.3" },
    { title: "The Wright Brothers", author: "David McCullough", isbn: "978-1476728759", dewey: "629.13" },
    { title: "Genghis Khan", author: "Jack Weatherford", isbn: "978-0609809648", dewey: "950" },
    { title: "The Rise and Fall of the Third Reich", author: "William Shirer", isbn: "978-1451651683", dewey: "943.086" },
    { title: "SPQR", author: "Mary Beard", isbn: "978-1631492228", dewey: "937" },
    { title: "The Silk Roads", author: "Peter Frankopan", isbn: "978-1101912379", dewey: "909" },
    { title: "Alexander Hamilton", author: "Ron Chernow", isbn: "978-0143034759", dewey: "973.4" },
    { title: "Cleopatra", author: "Stacy Schiff", isbn: "978-0316001946", dewey: "932" },
    { title: "The Crusades", author: "Thomas Asbridge", isbn: "978-0060787295", dewey: "909.07" },
    { title: "Unbroken", author: "Laura Hillenbrand", isbn: "978-0812974492", dewey: "940.54" },
    { title: "The Color of Law", author: "Richard Rothstein", isbn: "978-1631494536", dewey: "305.8" },
    { title: "Empires of the Word", author: "Nicholas Ostler", isbn: "978-0060935726", dewey: "409" },
  ],
  "Children's": [
    { title: "Charlotte's Web", author: "E.B. White", isbn: "978-0064410939", dewey: "813.52" },
    { title: "Where the Wild Things Are", author: "Maurice Sendak", isbn: "978-0064431781", dewey: "813.54" },
    { title: "Matilda", author: "Roald Dahl", isbn: "978-0142410370", dewey: "823.914" },
    { title: "The Very Hungry Caterpillar", author: "Eric Carle", isbn: "978-0399226908", dewey: "813.54" },
    { title: "Goodnight Moon", author: "Margaret Wise Brown", isbn: "978-0694003617", dewey: "813.52" },
    { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", isbn: "978-0590353427", dewey: "823.914" },
    { title: "The BFG", author: "Roald Dahl", isbn: "978-0142410387", dewey: "823.914" },
    { title: "Green Eggs and Ham", author: "Dr. Seuss", isbn: "978-0394800165", dewey: "813.52" },
    { title: "The Cat in the Hat", author: "Dr. Seuss", isbn: "978-0394800011", dewey: "813.52" },
    { title: "Charlie and the Chocolate Factory", author: "Roald Dahl", isbn: "978-0142410318", dewey: "823.914" },
    { title: "James and the Giant Peach", author: "Roald Dahl", isbn: "978-0142410363", dewey: "823.914" },
    { title: "The Giving Tree", author: "Shel Silverstein", isbn: "978-0060256654", dewey: "813.54" },
    { title: "A Wrinkle in Time", author: "Madeleine L'Engle", isbn: "978-0312367541", dewey: "813.54" },
    { title: "Percy Jackson: The Lightning Thief", author: "Rick Riordan", isbn: "978-0786838653", dewey: "813.54" },
    { title: "Diary of a Wimpy Kid", author: "Jeff Kinney", isbn: "978-0810993136", dewey: "813.54" },
  ],
  Reference: [
    { title: "Merriam-Webster Dictionary", author: "Merriam-Webster", isbn: "978-0877792956", dewey: "423" },
    { title: "Roget's Thesaurus", author: "Peter Mark Roget", isbn: "978-0061808944", dewey: "423.1" },
    { title: "The Chicago Manual of Style", author: "Univ. of Chicago", isbn: "978-0226287058", dewey: "808" },
    { title: "Encyclopaedia Britannica", author: "Britannica", isbn: "978-1593392925", dewey: "031" },
    { title: "Bartlett's Familiar Quotations", author: "John Bartlett", isbn: "978-0316017596", dewey: "808.88" },
    { title: "World Atlas", author: "National Geographic", isbn: "978-1426220586", dewey: "912" },
    { title: "CRC Handbook of Chemistry and Physics", author: "David Lide", isbn: "978-1482208672", dewey: "540" },
    { title: "Gray's Anatomy", author: "Henry Gray", isbn: "978-0702052309", dewey: "611" },
    { title: "Black's Law Dictionary", author: "Bryan Garner", isbn: "978-0314199492", dewey: "340.03" },
    { title: "The Elements of Style", author: "Strunk & White", isbn: "978-0205309023", dewey: "808" },
    { title: "AP Stylebook", author: "Associated Press", isbn: "978-0917360664", dewey: "808" },
    { title: "Oxford English Dictionary", author: "Oxford Univ. Press", isbn: "978-0199573158", dewey: "423" },
  ],
  Periodicals: [
    { title: "National Geographic (Jan)", author: "Nat Geo Society", isbn: "NGM-2025-01", dewey: "910" },
    { title: "Scientific American (Feb)", author: "SA Inc.", isbn: "SCA-2025-02", dewey: "505" },
    { title: "The New Yorker (Mar)", author: "Condé Nast", isbn: "TNY-2025-03", dewey: "051" },
    { title: "Nature (Apr)", author: "Springer Nature", isbn: "NAT-2025-04", dewey: "505" },
    { title: "TIME (May)", author: "TIME USA", isbn: "TIM-2025-05", dewey: "051" },
    { title: "The Economist (Jun)", author: "Economist Group", isbn: "ECO-2025-06", dewey: "330.05" },
    { title: "Wired (Jul)", author: "Condé Nast", isbn: "WRD-2025-07", dewey: "620.05" },
    { title: "The Atlantic (Aug)", author: "Atlantic Media", isbn: "ATL-2025-08", dewey: "051" },
    { title: "New Scientist (Sep)", author: "New Scientist", isbn: "NSC-2025-09", dewey: "505" },
    { title: "Harper's (Oct)", author: "Harper's Magazine", isbn: "HRP-2025-10", dewey: "051" },
    { title: "Science (Nov)", author: "AAAS", isbn: "SCI-2025-11", dewey: "505" },
    { title: "Poetry Magazine (Dec)", author: "Poetry Foundation", isbn: "POE-2025-12", dewey: "811.05" },
  ],
  "Special Collections": [
    { title: "First Folio (facsimile)", author: "William Shakespeare", isbn: "978-0393039856", dewey: "822.33" },
    { title: "Gutenberg Bible (repro)", author: "Johannes Gutenberg", isbn: "978-3836502061", dewey: "220.5" },
    { title: "Codex Leicester", author: "Leonardo da Vinci", isbn: "978-0714117607", dewey: "509" },
    { title: "Principia Mathematica", author: "Isaac Newton", isbn: "978-0520088177", dewey: "531" },
    { title: "Birds of America", author: "John James Audubon", isbn: "978-1402789441", dewey: "598" },
    { title: "The Canterbury Tales (illus.)", author: "Geoffrey Chaucer", isbn: "978-0140424386", dewey: "821.1" },
    { title: "The Book of Kells (repro)", author: "Irish Monks", isbn: "978-0500238943", dewey: "745.67" },
    { title: "Dead Sea Scrolls: Complete", author: "Various", isbn: "978-0060684662", dewey: "296.1" },
    { title: "Voynich Manuscript Study", author: "Raymond Clemens", isbn: "978-0300217230", dewey: "091" },
    { title: "Nuremberg Chronicle", author: "Hartmann Schedel", isbn: "978-3822850800", dewey: "909" },
  ],
  Uncategorized: [
    { title: "Misc. Donation #1", author: "Unknown", isbn: "N/A", dewey: "000" },
    { title: "Misc. Donation #2", author: "Unknown", isbn: "N/A", dewey: "000" },
    { title: "Misc. Donation #3", author: "Unknown", isbn: "N/A", dewey: "000" },
    { title: "Misc. Donation #4", author: "Unknown", isbn: "N/A", dewey: "000" },
    { title: "Misc. Donation #5", author: "Unknown", isbn: "N/A", dewey: "000" },
    { title: "Misc. Donation #6", author: "Unknown", isbn: "N/A", dewey: "000" },
    { title: "Unprocessed Vol. 1", author: "Various", isbn: "N/A", dewey: "000" },
    { title: "Unprocessed Vol. 2", author: "Various", isbn: "N/A", dewey: "000" },
    { title: "Unprocessed Vol. 3", author: "Various", isbn: "N/A", dewey: "000" },
    { title: "Unprocessed Vol. 4", author: "Various", isbn: "N/A", dewey: "000" },
  ],
};

const SPINE_COLORS = [
  "#8B4513", "#A0522D", "#D2691E", "#CD853F", "#DEB887",
  "#1a1a2e", "#16213e", "#0f3460", "#533483", "#e94560",
  "#2d6a4f", "#40916c", "#52b788", "#74c69d", "#b7e4c7",
  "#6d6875", "#b5838d", "#e5989b", "#ffb4a2", "#ffcdb2",
  "#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateShelfTiers(data: ShelfNodeData): ShelfTierData[] {
  const catalog = BOOK_CATALOG[data.category] ?? BOOK_CATALOG.Uncategorized;
  const totalBooks = data.currentUsed;
  const tiers: ShelfTierData[] = [];

  // Create a deterministic random from the label to keep it stable
  const seed = data.label.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
  const rand = seededRandom(seed);

  // Distribute books across tiers with slight variation
  const basePerTier = Math.floor(totalBooks / data.numberOfTiers);
  let remainder = totalBooks - basePerTier * data.numberOfTiers;

  let bookIndex = 0;

  for (let t = 0; t < data.numberOfTiers; t++) {
    const count = basePerTier + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    const books: ShelfBookDetail[] = [];
    for (let b = 0; b < count; b++) {
      const template = catalog[bookIndex % catalog.length];
      const isCheckedOut: BookStatus = rand() < 0.2 ? "checked-out" : "available";

      const daysOut = Math.floor(rand() * 28) + 1;
      const dueDate = isCheckedOut === "checked-out"
        ? `2026-${String(Math.floor(rand() * 3) + 3).padStart(2, "0")}-${String(daysOut).padStart(2, "0")}`
        : null;

      books.push({
        id: `${data.label}-t${t + 1}-b${b + 1}`,
        title: template.title,
        author: template.author,
        isbn: template.isbn,
        dewey: template.dewey,
        status: isCheckedOut,
        dueDate,
        spineColor: SPINE_COLORS[Math.floor(rand() * SPINE_COLORS.length)],
        spineWidth: Math.floor(rand() * 15) + 14,
      });
      bookIndex++;
    }

    tiers.push({
      tierNumber: t + 1,
      books,
      capacity: data.capacityPerTier,
    });
  }

  return tiers;
}
