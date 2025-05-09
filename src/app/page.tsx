import Link from "next/link";
import LiveScores from "@/components/LiveScores";
import TeamRatings from "@/components/TeamRatings";
import TournamentBracket from "@/components/TournamentBracket";
import BracketOdds from "@/components/BracketOdds";
import FamilyScores from "@/components/FamilyScores";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Family Hockey Bracket
          </h1>
          <Link 
            href="/manage" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Manage Pool
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-8">
            <FamilyScores />
            {/* <LiveScores /> */}
            <TournamentBracket />
            <BracketOdds />
            <TeamRatings />
          </div>
        </div>
      </main>
      <footer className="bg-white dark:bg-gray-800 shadow mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 dark:text-gray-400">
            Family Hockey Bracket © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
