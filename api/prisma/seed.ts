// Seeds a handful of demo accounts with realistic libraries, so the app has
// something to look at (and log into) without registering fresh and adding
// books by hand. Safe to run repeatedly: users are upserted by email, and a
// user's books are only created the first time (if they already have any,
// they're left alone).
import { PrismaClient, type ReadingStatus } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "12345678";

interface DemoBook {
  title: string;
  author: string;
  genre: string;
  status: ReadingStatus;
  price: number;
}

interface DemoUser {
  name: string;
  email: string;
  books: DemoBook[];
}

const DEMO_USERS: DemoUser[] = [
  {
    name: "Dean Henderson",
    email: "dean.henderson@gmail.com",
    books: [
      { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic Fiction", status: "WANT_TO_READ", price: 10.99 },
      { title: "Pride and Prejudice", author: "Jane Austen", genre: "Romance", status: "READING", price: 9.99 },
      { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Historical Fiction", status: "COMPLETED", price: 13.99 },
      { title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", status: "READING", price: 14.99 },
      { title: "1984", author: "George Orwell", genre: "Dystopian Fiction", status: "COMPLETED", price: 12.99 },
      { title: "The Alchemist", author: "Paulo Coelho", genre: "Adventure Fiction", status: "COMPLETED", price: 11.99 },
      { title: "Atomic Habits", author: "James Clear", genre: "Self-Help", status: "WANT_TO_READ", price: 15.99 },
      { title: "Deep Work", author: "Cal Newport", genre: "Productivity", status: "READING", price: 15.99 },
      { title: "The Psychology of Money", author: "Morgan Housel", genre: "Finance", status: "WANT_TO_READ", price: 17.99 },
      { title: "Clean Code", author: "Robert C. Martin", genre: "Programming", status: "READING", price: 29.99 },
      { title: "The Pragmatic Programmer", author: "Andrew Hunt and David Thomas", genre: "Programming", status: "WANT_TO_READ", price: 34.99 },
    ],
  },
  {
    name: "Janice Smith",
    email: "janice.smith@gmail.com",
    books: [
      { title: "Introduction to Algorithms", author: "Thomas H. Cormen and others", genre: "Computer Science", status: "READING", price: 69.99 },
      { title: "Hands-On Machine Learning", author: "Aurélien Géron", genre: "Machine Learning", status: "WANT_TO_READ", price: 49.99 },
      { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell and Peter Norvig", genre: "Artificial Intelligence", status: "READING", price: 74.99 },
      { title: "The Martian", author: "Andy Weir", genre: "Science Fiction", status: "COMPLETED", price: 13.99 },
      { title: "Dune", author: "Frank Herbert", genre: "Science Fiction", status: "WANT_TO_READ", price: 15.99 },
      { title: "The Silent Patient", author: "Alex Michaelides", genre: "Thriller", status: "COMPLETED", price: 12.99 },
      { title: "And Then There Were None", author: "Agatha Christie", genre: "Mystery", status: "WANT_TO_READ", price: 10.99 },
      { title: "Sapiens", author: "Yuval Noah Harari", genre: "History", status: "READING", price: 18.99 },
      { title: "Educated", author: "Tara Westover", genre: "Memoir", status: "COMPLETED", price: 14.99 },
      { title: "The Diary of a Young Girl", author: "Anne Frank", genre: "Biography", status: "WANT_TO_READ", price: 9.99 },
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", genre: "Psychology", status: "READING", price: 19.99 },
      { title: "The Little Prince", author: "Antoine de Saint-Exupéry", genre: "Children’s Fiction", status: "COMPLETED", price: 8.99 },
      { title: "Dracula", author: "Bram Stoker", genre: "Horror", status: "WANT_TO_READ", price: 9.99 },
      { title: "The Count of Monte Cristo", author: "Alexandre Dumas", genre: "Adventure", status: "READING", price: 14.99 },
    ],
  },
  {
    name: "Stephanie Joelington",
    email: "stephanie.joelington@gmail.com",
    books: [
      { title: "Brave New World", author: "Aldous Huxley", genre: "Dystopian Fiction", status: "WANT_TO_READ", price: 12.99 },
      { title: "Fahrenheit 451", author: "Ray Bradbury", genre: "Science Fiction", status: "COMPLETED", price: 11.99 },
      { title: "Animal Farm", author: "George Orwell", genre: "Political Fiction", status: "READING", price: 9.99 },
      { title: "The Catcher in the Rye", author: "J.D. Salinger", genre: "Classic Fiction", status: "WANT_TO_READ", price: 12.99 },
      { title: "Jane Eyre", author: "Charlotte Brontë", genre: "Classic Romance", status: "COMPLETED", price: 10.99 },
      { title: "Wuthering Heights", author: "Emily Brontë", genre: "Gothic Fiction", status: "READING", price: 9.99 },
      { title: "Little Women", author: "Louisa May Alcott", genre: "Classic Fiction", status: "COMPLETED", price: 11.99 },
      { title: "The Picture of Dorian Gray", author: "Oscar Wilde", genre: "Gothic Fiction", status: "WANT_TO_READ", price: 10.99 },
      { title: "Crime and Punishment", author: "Fyodor Dostoevsky", genre: "Psychological Fiction", status: "READING", price: 15.99 },
      { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", genre: "Philosophical Fiction", status: "WANT_TO_READ", price: 18.99 },
      { title: "War and Peace", author: "Leo Tolstoy", genre: "Historical Fiction", status: "READING", price: 19.99 },
      { title: "Anna Karenina", author: "Leo Tolstoy", genre: "Classic Romance", status: "COMPLETED", price: 16.99 },
      { title: "Les Misérables", author: "Victor Hugo", genre: "Historical Fiction", status: "WANT_TO_READ", price: 17.99 },
      { title: "Don Quixote", author: "Miguel de Cervantes", genre: "Adventure", status: "COMPLETED", price: 14.99 },
    ],
  },
  {
    name: "Oliver Da Silva",
    email: "oliver.dasilva@gmail.com",
    books: [
      { title: "The Odyssey", author: "Homer", genre: "Epic Poetry", status: "READING", price: 11.99 },
      { title: "The Iliad", author: "Homer", genre: "Epic Poetry", status: "WANT_TO_READ", price: 11.99 },
      { title: "The Divine Comedy", author: "Dante Alighieri", genre: "Epic Poetry", status: "COMPLETED", price: 13.99 },
      { title: "Hamlet", author: "William Shakespeare", genre: "Tragedy", status: "READING", price: 8.99 },
      { title: "Romeo and Juliet", author: "William Shakespeare", genre: "Romance", status: "COMPLETED", price: 7.99 },
      { title: "Macbeth", author: "William Shakespeare", genre: "Tragedy", status: "WANT_TO_READ", price: 8.99 },
      { title: "The Lord of the Rings", author: "J.R.R. Tolkien", genre: "Fantasy", status: "READING", price: 29.99 },
      { title: "A Game of Thrones", author: "George R.R. Martin", genre: "Fantasy", status: "WANT_TO_READ", price: 16.99 },
      { title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", status: "READING", price: 18.99 },
      { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", genre: "Fantasy", status: "WANT_TO_READ", price: 14.99 },
      { title: "The Hunger Games", author: "Suzanne Collins", genre: "Dystopian Fiction", status: "COMPLETED", price: 12.99 },
      { title: "Educated", author: "Tara Westover", genre: "Memoir", status: "WANT_TO_READ", price: 14.99 },
    ],
  },
  {
    // Deliberately left empty — a good account for demoing the empty state,
    // and how Recommendations/Insights behave with no reading history yet.
    name: "Sarah Elisee",
    email: "sarah.elisee@gmail.com",
    books: [],
  },
];

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { name: demo.name, email: demo.email, password: passwordHash, role: "USER" },
    });

    const existingBookCount = await prisma.book.count({ where: { userId: user.id } });
    if (existingBookCount > 0) {
      console.log(`- ${demo.email}: already has ${existingBookCount} books, leaving as is`);
      continue;
    }

    if (demo.books.length > 0) {
      await prisma.book.createMany({
        data: demo.books.map((b) => ({ ...b, userId: user.id })),
      });
    }
    console.log(`- ${demo.email}: seeded with ${demo.books.length} books`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
