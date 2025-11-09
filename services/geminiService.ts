import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        intent: {
            type: Type.STRING,
            description: "The user's intent. Possible values: 'search', 'find_movie_and_nearby_theaters', 'recommend_movies'."
        },
        movieTitle: {
            type: Type.STRING,
            description: "The title of the movie the user is looking for. Can be null if not specified."
        },
        theaterName: {
            type: Type.STRING,
            description: "The name of the theater the user is looking for. Can be null if not specified."
        },
        genre: {
            type: Type.STRING,
            description: "The movie genre the user is interested in. Can be null if not specified."
        },
        query: {
            type: Type.STRING,
            description: "A general search query if the intent is 'search'. This can be a movie or theater name."
        }
    },
    required: ['intent']
};


export const interpretSearchQuery = async (query: string): Promise<any> => {
    const prompt = `
        Analyze the user's search query for a movie showtime app.
        The user query is: "${query}"

        Based on the query, determine the user's intent and extract relevant entities like movie title, theater name, or genre.
        
        Possible intents are:
        - 'search': For general searches of a movie or theater. The 'query' field should contain the search term.
        - 'find_movie_and_nearby_theaters': When the user wants to find the closest theaters for a specific movie. The 'movieTitle' field must be populated.
        - 'recommend_movies': When the user asks for movie recommendations. The 'genre' field can be populated if a specific genre is mentioned.
        
        Examples:
        - User query: "I want to watch Godzilla x Kong, find me the nearest theater"
          Response: {"intent": "find_movie_and_nearby_theaters", "movieTitle": "Godzilla x Kong"}
        - User query: "Dune Part 2"
          Response: {"intent": "search", "query": "Dune Part 2"}
        - User query: "Vieshow cinemas"
          Response: {"intent": "search", "query": "Vieshow cinemas"}
        - User query: "Recommend some movies for me" or "推薦我幾部電影"
          Response: {"intent": "recommend_movies"}
        - User query: "I want to watch sci-fi movies" or "我想看科幻類的電影"
          Response: {"intent": "recommend_movies", "genre": "科幻"}
        - User query: "Find me showtimes for Kung Fu Panda 4 at a Showtimes cinema"
          Response: {"intent": "search", "query": "Kung Fu Panda 4 Showtimes cinema"}

        Return the result as a JSON object matching the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Gemini interpretation failed, falling back to standard search:", e);
        return { intent: 'search', query: query };
    }
}