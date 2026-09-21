const dotenv = require("dotenv");
const path = require("path");
const { ObjectId } = require("mongodb");

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === "production" ? ".env.production" : ".env.development");
dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

const DatabaseConnection = require("../src/shared/database/database");
const config = require("../src/shared/config/setting");

const translations = [
    {
        contentId: "68b3b58ce5df7e914679f557",
        sourceSlug: "dong-tu-to-be-amisare",
        fields: {
            title: "The Verb To Be (am/is/are)",
            description: "In this lesson, you will learn the verb To Be (am / is / are), the most important foundation in English. You will learn how to use To Be to introduce yourself, make affirmative sentences, negatives, questions, and avoid common mistakes. After this lesson, you can confidently talk about your name, age, job, feelings, and location in English.",
            category: "Module 1: Basic Foundations",
            content: `
<div class="grammar-detail-step">
    <h3><span class="step-number">1</span>What is the verb "To Be"?</h3>
    <p>The verb <strong>To Be</strong> is the most basic and important verb in English. It means <strong>"be"</strong> and is used to describe identity, jobs, feelings, states, location, and basic information about a person or thing.</p>
    <p>This lesson is your first foundation for introducing yourself, talking about work, describing feelings, and saying where someone or something is.</p>
    <span class="note">To Be has three present forms: <strong>am</strong>, <strong>is</strong>, and <strong>are</strong>. The correct form depends on the subject.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">2</span>The three forms of To Be</h3>
    <p>Choose <strong>am</strong>, <strong>is</strong>, or <strong>are</strong> according to the subject:</p>
    <p style="margin-top: 15px;"><strong>1. AM - used with "I":</strong></p>
    <span class="formula">I + am</span>
    <span class="example">I am a student.</span>
    <span class="example">I am happy.</span>
    <span class="example">I am at home.</span>
    <p style="margin-top: 20px;"><strong>2. IS - used with "He, She, It":</strong></p>
    <span class="formula">He/She/It + is</span>
    <span class="example">He is a doctor.</span>
    <span class="example">She is beautiful.</span>
    <span class="example">It is a cat.</span>
    <p style="margin-top: 20px;"><strong>3. ARE - used with "You, We, They":</strong></p>
    <span class="formula">You/We/They + are</span>
    <span class="example">You are my friend.</span>
    <span class="example">We are students.</span>
    <span class="example">They are teachers.</span>
    <span class="note">Easy memory: I -> am | He/She/It -> is | You/We/They -> are</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">3</span>Affirmative sentences</h3>
    <span class="formula">Subject + am/is/are + noun/adjective/place</span>
    <p>Use this structure to say who someone is, what something is like, or where someone is.</p>
    <span class="example">I am a teacher.</span>
    <span class="example">She is a nurse.</span>
    <span class="example">They are students.</span>
    <span class="example">He is tall.</span>
    <span class="example">We are happy.</span>
    <span class="example">I am at school.</span>
    <span class="example">They are from Vietnam.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">4</span>Contractions</h3>
    <p>In everyday English, native speakers often use short forms:</p>
    <ul>
        <li><strong>I am</strong> -> <strong>I'm</strong></li>
        <li><strong>You are</strong> -> <strong>You're</strong></li>
        <li><strong>He is</strong> -> <strong>He's</strong></li>
        <li><strong>She is</strong> -> <strong>She's</strong></li>
        <li><strong>It is</strong> -> <strong>It's</strong></li>
        <li><strong>We are</strong> -> <strong>We're</strong></li>
        <li><strong>They are</strong> -> <strong>They're</strong></li>
    </ul>
    <span class="example">I'm a student.</span>
    <span class="example">She's my sister.</span>
    <span class="example">We're from Hanoi.</span>
    <span class="note">Contractions are common in speaking and informal writing. In formal writing, use the full form.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">5</span>Negative sentences</h3>
    <span class="formula">Subject + am/is/are + not + noun/adjective/place</span>
    <span class="example">I am not a doctor.</span>
    <span class="example">He is not tall.</span>
    <span class="example">They are not students.</span>
    <p style="margin-top: 15px;"><strong>Short negative forms:</strong></p>
    <ul>
        <li><strong>is not</strong> -> <strong>isn't</strong></li>
        <li><strong>are not</strong> -> <strong>aren't</strong></li>
        <li><strong>I am not</strong> -> <strong>I'm not</strong></li>
    </ul>
    <span class="example">She isn't at home.</span>
    <span class="example">We aren't tired.</span>
    <span class="important">Important: Do not say "I amn't". Use <strong>I'm not</strong> or <strong>I am not</strong>.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">6</span>Yes/No questions</h3>
    <span class="formula">Am/Is/Are + subject + noun/adjective/place?</span>
    <p>To make a question, move <strong>am/is/are</strong> before the subject.</p>
    <span class="example">Am I late?</span>
    <span class="example">Is she a teacher?</span>
    <span class="example">Are you hungry?</span>
    <span class="example">Are they from Korea?</span>
    <p style="margin-top: 15px;"><strong>Short answers:</strong></p>
    <span class="formula">Yes, subject + am/is/are. / No, subject + am not/isn't/aren't.</span>
    <span class="example">Are you a student? -> Yes, I am. / No, I'm not.</span>
    <span class="example">Is he your brother? -> Yes, he is. / No, he isn't.</span>
    <span class="note">Do not use contractions in positive short answers. Say "Yes, she is", not "Yes, she's".</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">7</span>Wh-questions with To Be</h3>
    <span class="formula">Wh-word + am/is/are + subject + ...?</span>
    <ul>
        <li><strong>What</strong> asks about things or information.</li>
        <li><strong>Where</strong> asks about location.</li>
        <li><strong>Who</strong> asks about people.</li>
        <li><strong>How</strong> asks about condition.</li>
        <li><strong>How old</strong> asks about age.</li>
    </ul>
    <span class="example">What is your name?</span>
    <span class="example">Where are you from?</span>
    <span class="example">Who is she?</span>
    <span class="example">How are you?</span>
    <span class="example">How old is he?</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">8</span>Real-life use: introducing yourself</h3>
    <p>To Be is extremely useful when you introduce yourself:</p>
    <span class="example">Hi! I'm Nam. I'm from Vietnam. I'm 20 years old. I'm a student. I'm interested in music.</span>
    <span class="example">My name is Mai.</span>
    <span class="example">I'm from Ho Chi Minh City.</span>
    <span class="example">I'm a high school student.</span>
    <span class="example">I'm interested in sports.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">9</span>Common mistakes to avoid</h3>
    <span class="important"><strong>Mistake 1:</strong> Forgetting To Be<br>Wrong: I a student.<br>Correct: I am a student.</span>
    <span class="important"><strong>Mistake 2:</strong> Using the wrong form<br>Wrong: I is happy. / He are a teacher.<br>Correct: I am happy. / He is a teacher.</span>
    <span class="important"><strong>Mistake 3:</strong> Forgetting "not"<br>Correct: She is not a doctor. / She isn't a doctor.</span>
    <span class="important"><strong>Mistake 4:</strong> Not moving To Be in questions<br>Wrong: You are a student?<br>Correct: Are you a student?</span>
    <span class="important"><strong>Mistake 5:</strong> Wrong contraction<br>Wrong: I amn't happy.<br>Correct: I'm not happy.</span>
</div>
<div class="grammar-detail-completion">
    Congratulations! You have completed "The Verb To Be (am/is/are)".<br>
    Now you can introduce yourself in English.<br>
    Next, take the quiz to check your knowledge.
</div>`,
            quizzes: [
                { question: "Choose the correct sentence:", type: "multiple-choice", correctAnswer: "I am a student.", explanation: "The subject I always uses am: I am.", options: ["I is a student.", "I am a student.", "I are a student.", ""] },
                { question: "Fill in the blank: She ...... my sister.", type: "fill-in-the-blank", correctAnswer: "is", explanation: "The subject She uses is.", options: [] },
                { question: "Which negative sentence is grammatically correct?", type: "multiple-choice", correctAnswer: "He is not happy.", explanation: "Negative with To Be: subject + am/is/are + not.", options: ["He not is happy.", "He am not happy.", "He is not happy.", ""] },
                { question: "Fill in the blank: We ...... from Vietnam.", type: "fill-in-the-blank", correctAnswer: "are", explanation: "The subject We uses are.", options: [] },
                { question: "Which question is correct?", type: "multiple-choice", correctAnswer: "Are you a student?", explanation: "Questions with To Be move the verb before the subject: Are + you + ...?", options: ["You are a student?", "Are you a student?", "Is you a student?", ""] },
                { question: "Fill in the blank: I ...... not tired.", type: "fill-in-the-blank", correctAnswer: "am", explanation: "With I, use am: I am not / I'm not.", options: [] },
                { question: "Which short answer is correct for: Is she your teacher?", type: "multiple-choice", correctAnswer: "Yes, she is.", explanation: "In positive short answers, do not use contractions.", options: ["Yes, she's.", "Yes, she is.", "Yes, she's is.", ""] }
            ]
        }
    },
    {
        contentId: "68b3b762e5df7e914679f558",
        sourceSlug: "dai-tu-nhan-xung-i-you-he-she-it-we-they",
        fields: {
            title: "Personal Pronouns (I, you, he, she, it, we, they)",
            description: "This lesson helps you understand and use English personal pronouns (I, you, he, she, it, we, they) as subjects and objects. You will learn how to distinguish he / she / it, avoid common mistakes, and apply pronouns in daily communication.",
            category: "Module 1: Basic Foundations",
            content: `
<div class="grammar-detail-step">
    <h3><span class="step-number">1</span>What are personal pronouns?</h3>
    <p><strong>Personal pronouns</strong> are words that replace names of people, animals, or things. They help us avoid repeating names too many times.</p>
    <span class="example">Nam is a student. Nam goes to school every day. -> Nam is a student. He goes to school every day.</span>
    <span class="note">Pronouns make sentences shorter, smoother, and more natural.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">2</span>Subject pronouns</h3>
    <p>Subject pronouns do the action in a sentence. They usually stand before the verb.</p>
    <span class="formula">Subject pronoun + verb</span>
    <ul>
        <li><strong>I</strong> = the speaker</li>
        <li><strong>You</strong> = the listener, one person or many people</li>
        <li><strong>He</strong> = one male person</li>
        <li><strong>She</strong> = one female person</li>
        <li><strong>It</strong> = one thing, animal, idea, weather, or time</li>
        <li><strong>We</strong> = I + another person or people</li>
        <li><strong>They</strong> = other people, animals, or things</li>
    </ul>
    <span class="example">I live in Hanoi.</span>
    <span class="example">She is a teacher.</span>
    <span class="example">They are students.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">3</span>Object pronouns</h3>
    <p>Object pronouns receive the action. They often come after verbs or prepositions.</p>
    <span class="formula">Verb/preposition + object pronoun</span>
    <ul>
        <li>I -> <strong>me</strong></li>
        <li>you -> <strong>you</strong></li>
        <li>he -> <strong>him</strong></li>
        <li>she -> <strong>her</strong></li>
        <li>it -> <strong>it</strong></li>
        <li>we -> <strong>us</strong></li>
        <li>they -> <strong>them</strong></li>
    </ul>
    <span class="example">She helps me.</span>
    <span class="example">I know him.</span>
    <span class="example">The teacher talks to us.</span>
    <span class="example">We like them.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">4</span>He, she, and it</h3>
    <p>Use <strong>he</strong> for a male person, <strong>she</strong> for a female person, and <strong>it</strong> for one thing, animal, weather, time, or situation.</p>
    <span class="example">My father is kind. He is a doctor.</span>
    <span class="example">Lan is my friend. She studies English.</span>
    <span class="example">This phone is new. It is expensive.</span>
    <span class="example">It is raining today.</span>
    <span class="important">Do not use "he" or "she" for objects. Use "it".</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">5</span>You can be singular or plural</h3>
    <p>In English, <strong>you</strong> can mean one person or many people.</p>
    <span class="example">You are my friend. (one person)</span>
    <span class="example">You are students. (many people)</span>
    <span class="note">Context tells us whether "you" is singular or plural.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">6</span>We and they</h3>
    <p><strong>We</strong> includes the speaker. <strong>They</strong> talks about other people or things.</p>
    <span class="example">My brother and I are students. We study every day.</span>
    <span class="example">Nam and Lan are friends. They live in Da Nang.</span>
    <span class="example">The books are on the table. They are old.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">7</span>Common mistakes to avoid</h3>
    <span class="important"><strong>Mistake 1:</strong> Using object pronouns as subjects<br>Wrong: Me am a student.<br>Correct: I am a student.</span>
    <span class="important"><strong>Mistake 2:</strong> Using he/she for things<br>Wrong: The book is good. He is new.<br>Correct: The book is good. It is new.</span>
    <span class="important"><strong>Mistake 3:</strong> Confusing we and they<br>Use "we" when you are included. Use "they" when you are not included.</span>
</div>
<div class="grammar-detail-completion">
    Great job! You now understand basic personal pronouns.<br>
    Use them to make your English shorter, clearer, and more natural.
</div>`,
            quizzes: [
                { question: "Choose the correct subject pronoun: Nam is my brother. ...... is a student.", type: "multiple-choice", correctAnswer: "He", explanation: "Nam is male, so we use He.", options: ["She", "He", "It", ""] },
                { question: "Fill in the blank: Lan is my friend. I like ......", type: "fill-in-the-blank", correctAnswer: "her", explanation: "After the verb like, use the object pronoun her.", options: [] },
                { question: "Choose the correct sentence:", type: "multiple-choice", correctAnswer: "They are teachers.", explanation: "They is a subject pronoun and uses are.", options: ["Them are teachers.", "They are teachers.", "They is teachers.", ""] },
                { question: "Fill in the blank: My phone is new. ...... is expensive.", type: "fill-in-the-blank", correctAnswer: "It", explanation: "Use It for one thing.", options: [] },
                { question: "Which pronoun can refer to one person or many people?", type: "multiple-choice", correctAnswer: "You", explanation: "You can be singular or plural.", options: ["I", "You", "He", ""] },
                { question: "Fill in the blank: My sister and I are students. ...... study English.", type: "fill-in-the-blank", correctAnswer: "We", explanation: "My sister and I includes the speaker, so use We.", options: [] },
                { question: "Choose the correct object pronoun: The teacher helps ......", type: "multiple-choice", correctAnswer: "us", explanation: "After a verb, use an object pronoun.", options: ["we", "us", "our", ""] }
            ]
        }
    },
    {
        contentId: "68b3b80ae5df7e914679f559",
        sourceSlug: "danh-tu-so-it-va-so-nhieu",
        fields: {
            title: "Singular and Plural Nouns",
            description: "This lesson explains singular and plural nouns in English. You will learn when to use one noun, when to use many nouns, how to add -s or -es, common spelling changes, irregular plural nouns, and mistakes to avoid.",
            category: "Module 1: Basic Foundations",
            content: `
<div class="grammar-detail-step">
    <h3><span class="step-number">1</span>What are singular and plural nouns?</h3>
    <p>A <strong>singular noun</strong> names one person, animal, place, thing, or idea. A <strong>plural noun</strong> names two or more.</p>
    <span class="example">one book -> two books</span>
    <span class="example">one student -> three students</span>
    <span class="example">one cat -> many cats</span>
    <span class="note">In English, the noun usually changes when there is more than one.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">2</span>The basic rule: add -s</h3>
    <p>Most nouns become plural by adding <strong>-s</strong>.</p>
    <span class="formula">noun + s</span>
    <ul>
        <li>book -> books</li>
        <li>pen -> pens</li>
        <li>teacher -> teachers</li>
        <li>car -> cars</li>
        <li>room -> rooms</li>
    </ul>
    <span class="example">I have two books.</span>
    <span class="example">There are five students in the room.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">3</span>Add -es</h3>
    <p>Add <strong>-es</strong> to nouns ending in <strong>-s, -ss, -sh, -ch, -x, -o</strong>.</p>
    <span class="formula">noun ending in -s/-ss/-sh/-ch/-x/-o + es</span>
    <ul>
        <li>bus -> buses</li>
        <li>class -> classes</li>
        <li>dish -> dishes</li>
        <li>watch -> watches</li>
        <li>box -> boxes</li>
        <li>tomato -> tomatoes</li>
    </ul>
    <span class="note">We add -es because these words are easier to pronounce with an extra syllable.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">4</span>Nouns ending in consonant + y</h3>
    <p>If a noun ends in <strong>consonant + y</strong>, change <strong>y</strong> to <strong>ies</strong>.</p>
    <span class="formula">consonant + y -> ies</span>
    <span class="example">city -> cities</span>
    <span class="example">baby -> babies</span>
    <span class="example">family -> families</span>
    <p>If a noun ends in <strong>vowel + y</strong>, just add <strong>-s</strong>.</p>
    <span class="example">boy -> boys</span>
    <span class="example">day -> days</span>
    <span class="example">key -> keys</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">5</span>Nouns ending in -f or -fe</h3>
    <p>Some nouns ending in <strong>-f</strong> or <strong>-fe</strong> change to <strong>-ves</strong>.</p>
    <span class="example">leaf -> leaves</span>
    <span class="example">wife -> wives</span>
    <span class="example">knife -> knives</span>
    <p>But some only add <strong>-s</strong>:</p>
    <span class="example">roof -> roofs</span>
    <span class="example">chef -> chefs</span>
    <span class="note">When unsure, check a dictionary and remember common examples first.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">6</span>Irregular plural nouns</h3>
    <p>Some plural nouns do not follow the regular rules.</p>
    <ul>
        <li>man -> men</li>
        <li>woman -> women</li>
        <li>child -> children</li>
        <li>person -> people</li>
        <li>tooth -> teeth</li>
        <li>foot -> feet</li>
        <li>mouse -> mice</li>
    </ul>
    <span class="important">These forms must be memorized because they are irregular.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">7</span>Using a/an and numbers</h3>
    <p>Use <strong>a/an</strong> with singular countable nouns, and use numbers or quantifiers with plural nouns.</p>
    <span class="example">a book / an apple</span>
    <span class="example">two books / three apples</span>
    <span class="example">many students / some chairs</span>
    <span class="important">Do not use a/an with plural nouns. Say "a book", not "a books".</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">8</span>Common mistakes to avoid</h3>
    <span class="important">Wrong: two book<br>Correct: two books</span>
    <span class="important">Wrong: a apples<br>Correct: an apple / apples</span>
    <span class="important">Wrong: childs<br>Correct: children</span>
    <span class="important">Wrong: citys<br>Correct: cities</span>
</div>
<div class="grammar-detail-completion">
    Well done! You can now form singular and plural nouns more accurately.<br>
    Practice with objects around you: one pen, two pens; one city, many cities.
</div>`,
            quizzes: [
                { question: "Choose the correct plural form of book:", type: "multiple-choice", correctAnswer: "books", explanation: "Most nouns add -s.", options: ["bookes", "books", "bookies", ""] },
                { question: "Fill in the blank: I have two ...... (pen).", type: "fill-in-the-blank", correctAnswer: "pens", explanation: "Pen is regular, so add -s.", options: [] },
                { question: "Choose the correct plural form of class:", type: "multiple-choice", correctAnswer: "classes", explanation: "Class ends in -ss, so add -es.", options: ["classs", "classes", "classies", ""] },
                { question: "Fill in the blank: There are many ...... in this country. (city)", type: "fill-in-the-blank", correctAnswer: "cities", explanation: "City ends in consonant + y, so y changes to ies.", options: [] },
                { question: "Choose the irregular plural noun:", type: "multiple-choice", correctAnswer: "children", explanation: "Child becomes children, not childs.", options: ["childs", "children", "childes", ""] },
                { question: "Fill in the blank: She has an ......", type: "fill-in-the-blank", correctAnswer: "apple", explanation: "Use an before a singular noun beginning with a vowel sound.", options: [] },
                { question: "Choose the correct sentence:", type: "multiple-choice", correctAnswer: "I have three books.", explanation: "After three, the noun must be plural.", options: ["I have three book.", "I have three books.", "I have a books.", ""] }
            ]
        }
    },
    {
        contentId: "6940cabdfaf8b962fc19d986",
        sourceSlug: "mao-tu-aanthe",
        fields: {
            title: "Articles a/an/the",
            description: "This lesson teaches you how to use the English articles a, an, and the. You will learn the difference between general and specific nouns, when to use a or an, when to use the, and common mistakes Vietnamese learners often make.",
            category: "Module 1: Basic Foundations",
            content: `
<div class="grammar-detail-step">
    <h3><span class="step-number">1</span>What are articles?</h3>
    <p>Articles are small words placed before nouns. English has three main articles: <strong>a</strong>, <strong>an</strong>, and <strong>the</strong>.</p>
    <span class="example">a book</span>
    <span class="example">an apple</span>
    <span class="example">the teacher</span>
    <span class="note">Articles help the listener know whether we are talking about something general or something specific.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">2</span>Use a with singular countable nouns</h3>
    <p>Use <strong>a</strong> before a singular countable noun when the noun begins with a consonant sound.</p>
    <span class="formula">a + singular countable noun</span>
    <span class="example">a student</span>
    <span class="example">a teacher</span>
    <span class="example">a car</span>
    <span class="example">a university</span>
    <span class="note">"University" begins with the /ju:/ sound, so we say <strong>a university</strong>.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">3</span>Use an before vowel sounds</h3>
    <p>Use <strong>an</strong> before a singular countable noun that begins with a vowel sound.</p>
    <span class="formula">an + vowel sound</span>
    <span class="example">an apple</span>
    <span class="example">an egg</span>
    <span class="example">an umbrella</span>
    <span class="example">an hour</span>
    <span class="note">"Hour" begins with a vowel sound because the h is silent.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">4</span>Use the for something specific</h3>
    <p>Use <strong>the</strong> when both speaker and listener know exactly which person or thing is being discussed.</p>
    <span class="example">I bought a book. The book is very interesting.</span>
    <span class="example">Please close the door. (the door in this room)</span>
    <span class="example">The teacher in our class is kind.</span>
    <span class="note">A/an introduces something for the first time. The refers to something already known or specific.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">5</span>Use the with unique things</h3>
    <p>Use <strong>the</strong> for things that are unique or one of a kind in the context.</p>
    <span class="example">the sun</span>
    <span class="example">the moon</span>
    <span class="example">the internet</span>
    <span class="example">the president</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">6</span>No article with plural/general nouns</h3>
    <p>When speaking generally about plural nouns or uncountable nouns, we often use no article.</p>
    <span class="example">Students need practice.</span>
    <span class="example">Dogs are friendly animals.</span>
    <span class="example">Water is important.</span>
    <span class="example">I like music.</span>
    <span class="important">Do not say "the music" when you mean music in general.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">7</span>Common mistakes to avoid</h3>
    <span class="important">Wrong: I have book.<br>Correct: I have a book.</span>
    <span class="important">Wrong: She is an teacher.<br>Correct: She is a teacher.</span>
    <span class="important">Wrong: I bought a apple.<br>Correct: I bought an apple.</span>
    <span class="important">Wrong: The water is important. (when speaking generally)<br>Correct: Water is important.</span>
</div>
<div class="grammar-detail-completion">
    Excellent! You now understand the basic use of a, an, and the.<br>
    Articles are small, but they make your English sound much more natural.
</div>`,
            quizzes: [
                { question: "Choose the correct article: ...... book", type: "multiple-choice", correctAnswer: "a", explanation: "Book begins with a consonant sound.", options: ["a", "an", "the", ""] },
                { question: "Fill in the blank: She eats ...... apple every day.", type: "fill-in-the-blank", correctAnswer: "an", explanation: "Apple begins with a vowel sound.", options: [] },
                { question: "Choose the correct phrase:", type: "multiple-choice", correctAnswer: "an hour", explanation: "Hour begins with a vowel sound because h is silent.", options: ["a hour", "an hour", "the hour for general meaning", ""] },
                { question: "Fill in the blank: I bought a pen. ...... pen is blue.", type: "fill-in-the-blank", correctAnswer: "The", explanation: "The pen has already been introduced, so use The.", options: [] },
                { question: "Choose the sentence that talks generally:", type: "multiple-choice", correctAnswer: "Dogs are friendly animals.", explanation: "For plural nouns in general, use no article.", options: ["The dogs are friendly animals.", "Dogs are friendly animals.", "A dogs are friendly animals.", ""] },
                { question: "Fill in the blank: ...... sun is bright today.", type: "fill-in-the-blank", correctAnswer: "The", explanation: "The sun is unique, so use The.", options: [] },
                { question: "Choose the correct sentence:", type: "multiple-choice", correctAnswer: "I have a university friend.", explanation: "University begins with the /ju:/ consonant sound.", options: ["I have an university friend.", "I have a university friend.", "I have university friend.", ""] }
            ]
        }
    },
    {
        contentId: "6940cbd8faf8b962fc19d987",
        sourceSlug: "tinh-tu-mo-ta-don-gian",
        fields: {
            title: "Simple Descriptive Adjectives",
            description: "This lesson introduces simple descriptive adjectives in English. You will learn how adjectives describe people, things, feelings, and places, where adjectives stand in a sentence, and how to avoid common word-order mistakes.",
            category: "Module 1: Basic Foundations",
            content: `
<div class="grammar-detail-step">
    <h3><span class="step-number">1</span>What are descriptive adjectives?</h3>
    <p><strong>Descriptive adjectives</strong> are words that describe nouns. They tell us what a person, thing, place, or feeling is like.</p>
    <span class="example">a big house</span>
    <span class="example">a happy student</span>
    <span class="example">a beautiful city</span>
    <span class="note">Adjectives make your sentences clearer and more interesting.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">2</span>Adjectives before nouns</h3>
    <p>In English, adjectives usually come before nouns.</p>
    <span class="formula">adjective + noun</span>
    <span class="example">a small room</span>
    <span class="example">a new phone</span>
    <span class="example">an old book</span>
    <span class="example">a kind teacher</span>
    <span class="important">Word order matters: say "a red car", not "a car red".</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">3</span>Adjectives after To Be</h3>
    <p>Adjectives can also come after the verb <strong>To Be</strong>.</p>
    <span class="formula">Subject + am/is/are + adjective</span>
    <span class="example">I am happy.</span>
    <span class="example">She is tall.</span>
    <span class="example">The room is clean.</span>
    <span class="example">They are friendly.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">4</span>Common adjectives for people</h3>
    <ul>
        <li>tall / short</li>
        <li>young / old</li>
        <li>kind / friendly</li>
        <li>smart / hard-working</li>
        <li>happy / sad / tired</li>
    </ul>
    <span class="example">My brother is tall.</span>
    <span class="example">She is a friendly teacher.</span>
    <span class="example">They are hard-working students.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">5</span>Common adjectives for things and places</h3>
    <ul>
        <li>big / small</li>
        <li>new / old</li>
        <li>clean / dirty</li>
        <li>beautiful / ugly</li>
        <li>hot / cold</li>
        <li>easy / difficult</li>
    </ul>
    <span class="example">This is a new laptop.</span>
    <span class="example">The city is beautiful.</span>
    <span class="example">English grammar is easy with practice.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">6</span>Adjectives do not change for plural nouns</h3>
    <p>English adjectives do not add -s for plural nouns.</p>
    <span class="example">one small room -> two small rooms</span>
    <span class="example">one friendly student -> many friendly students</span>
    <span class="important">Wrong: beautifuls flowers<br>Correct: beautiful flowers</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">7</span>Using very and really</h3>
    <p>Use <strong>very</strong> or <strong>really</strong> before adjectives to make the meaning stronger.</p>
    <span class="example">She is very kind.</span>
    <span class="example">This lesson is really useful.</span>
    <span class="example">The room is very clean.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">8</span>Common mistakes to avoid</h3>
    <span class="important">Wrong: a car red<br>Correct: a red car</span>
    <span class="important">Wrong: She beautiful.<br>Correct: She is beautiful.</span>
    <span class="important">Wrong: two news phones<br>Correct: two new phones</span>
    <span class="important">Wrong: The lesson very easy.<br>Correct: The lesson is very easy.</span>
</div>
<div class="grammar-detail-completion">
    Great work! You can now use simple adjectives to describe people, things, feelings, and places more naturally.
</div>`,
            quizzes: [
                { question: "Choose the correct phrase:", type: "multiple-choice", correctAnswer: "a red car", explanation: "Adjectives usually come before nouns.", options: ["a car red", "a red car", "a car is red", ""] },
                { question: "Fill in the blank: She ...... happy.", type: "fill-in-the-blank", correctAnswer: "is", explanation: "Use To Be before an adjective: She is happy.", options: [] },
                { question: "Choose the correct plural phrase:", type: "multiple-choice", correctAnswer: "beautiful flowers", explanation: "Adjectives do not become plural in English.", options: ["beautifuls flowers", "beautiful flowers", "flowers beautifuls", ""] },
                { question: "Fill in the blank: This is a ...... phone. (new)", type: "fill-in-the-blank", correctAnswer: "new", explanation: "The adjective new comes before the noun phone.", options: [] },
                { question: "Choose the correct sentence:", type: "multiple-choice", correctAnswer: "The room is clean.", explanation: "Use To Be before the adjective clean.", options: ["The room clean.", "The room is clean.", "The clean room is.", ""] },
                { question: "Fill in the blank: They are ...... students.", type: "fill-in-the-blank", correctAnswer: "friendly", explanation: "Friendly describes students and does not add -s.", options: [] },
                { question: "Choose the word that makes the adjective stronger:", type: "multiple-choice", correctAnswer: "very", explanation: "Very can intensify adjectives.", options: ["very", "many", "a", ""] }
            ]
        }
    },
    {
        contentId: "6952494c89ba7e87cc85fb20",
        sourceSlug: "thi-hien-tai-don-voi-dong-tu-thuong-khang-dinh",
        fields: {
            title: "Present Simple with Action Verbs (Affirmative)",
            description: "This lesson teaches the affirmative form of the present simple with action verbs. You will learn how to use verbs with I, you, we, they and he, she, it, when to add -s or -es, common spelling rules, and how to describe daily habits confidently.",
            category: "Module 2: Present Simple Tense",
            content: `
<div class="grammar-detail-step">
    <h3><span class="step-number">1</span>What is the present simple?</h3>
    <p>The <strong>present simple</strong> is used to talk about habits, routines, facts, schedules, and things that are generally true.</p>
    <span class="example">I study English every day.</span>
    <span class="example">She works in a bank.</span>
    <span class="example">The sun rises in the east.</span>
    <span class="note">This lesson focuses on affirmative sentences with action verbs.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">2</span>With I, You, We, They</h3>
    <p>With <strong>I, You, We, They</strong>, use the base form of the verb.</p>
    <span class="formula">I/You/We/They + base verb</span>
    <span class="example">I live in Hanoi.</span>
    <span class="example">You speak English well.</span>
    <span class="example">We study at university.</span>
    <span class="example">They work hard.</span>
    <span class="note">The verb does not change with I, You, We, They.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">3</span>With He, She, It</h3>
    <p>With <strong>He, She, It</strong>, add <strong>-s</strong> or <strong>-es</strong> to the verb.</p>
    <span class="formula">He/She/It + verb(s/es)</span>
    <span class="example">He lives in Hanoi.</span>
    <span class="example">She teaches English.</span>
    <span class="example">It rains a lot in summer.</span>
    <span class="important">This -s/-es ending is required in affirmative present simple sentences with he, she, and it.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">4</span>Add -s to most verbs</h3>
    <p>Most verbs only need <strong>-s</strong>.</p>
    <ul>
        <li>work -> works</li>
        <li>play -> plays</li>
        <li>eat -> eats</li>
        <li>drink -> drinks</li>
        <li>sleep -> sleeps</li>
        <li>write -> writes</li>
    </ul>
    <span class="example">He works in a bank.</span>
    <span class="example">She plays the piano.</span>
    <span class="example">My father reads newspapers every morning.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">5</span>Add -es to certain verbs</h3>
    <p>Add <strong>-es</strong> to verbs ending in <strong>-s, -ss, -ch, -sh, -x, -o</strong>.</p>
    <ul>
        <li>watch -> watches</li>
        <li>teach -> teaches</li>
        <li>wash -> washes</li>
        <li>fix -> fixes</li>
        <li>go -> goes</li>
        <li>do -> does</li>
    </ul>
    <span class="example">She watches TV every evening.</span>
    <span class="example">He goes to school.</span>
    <span class="note">We add -es because these endings are easier to pronounce with an extra syllable.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">6</span>Change y to ies</h3>
    <p>If a verb ends in <strong>consonant + y</strong>, change <strong>y</strong> to <strong>ies</strong>.</p>
    <span class="example">study -> studies</span>
    <span class="example">try -> tries</span>
    <span class="example">carry -> carries</span>
    <p>If a verb ends in <strong>vowel + y</strong>, only add <strong>-s</strong>.</p>
    <span class="example">play -> plays</span>
    <span class="example">enjoy -> enjoys</span>
    <span class="example">say -> says</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">7</span>The special verb have</h3>
    <p><strong>Have</strong> is irregular with he, she, and it.</p>
    <span class="formula">have -> has</span>
    <span class="example">I have a car.</span>
    <span class="example">They have a big house.</span>
    <span class="example">He has a bike.</span>
    <span class="example">She has a cat.</span>
    <span class="important">Do not say "haves". The correct form is <strong>has</strong>.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">8</span>Common time expressions</h3>
    <p>The present simple is often used with frequency adverbs and repeated time expressions.</p>
    <ul>
        <li>always, usually, often, sometimes, rarely, never</li>
        <li>every day, every week, every month</li>
        <li>once a week, twice a month</li>
        <li>on Mondays, in the morning</li>
    </ul>
    <span class="example">I always get up at 6 a.m.</span>
    <span class="example">She usually drinks coffee in the morning.</span>
    <span class="example">He plays football twice a week.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">9</span>Real-life use: daily habits</h3>
    <span class="example"><strong>My routine:</strong><br>I wake up at 6 a.m. every day. I brush my teeth, take a shower, and have breakfast. I go to work at 7:30 a.m. In the evening, I read books and watch TV.</span>
    <span class="example"><strong>His routine:</strong><br>My brother lives in Hanoi. He works at a hospital. He helps many patients every day. In his free time, he plays basketball.</span>
    <span class="note">Notice how verbs change with he/she/it: lives, works, helps, plays.</span>
</div>
<div class="grammar-detail-step">
    <h3><span class="step-number">10</span>Common mistakes to avoid</h3>
    <span class="important">Wrong: He play football.<br>Correct: He plays football.</span>
    <span class="important">Wrong: I plays tennis.<br>Correct: I play tennis.</span>
    <span class="important">Wrong: She watchs TV.<br>Correct: She watches TV.</span>
    <span class="important">Wrong: She studys English.<br>Correct: She studies English.</span>
    <span class="important">Wrong: He have a car.<br>Correct: He has a car.</span>
</div>
<div class="grammar-detail-completion">
    Excellent! You now understand affirmative present simple sentences with action verbs.<br>
    You can describe daily habits and routines with more confidence.
</div>`,
            quizzes: [
                { question: "Choose the correct sentence:", type: "multiple-choice", correctAnswer: "She works in a bank.", explanation: "With She, add -s to the verb: works.", options: ["She work in a bank.", "She works in a bank.", "She working in a bank.", ""] },
                { question: "Fill in the blank: He ....... (play) football every weekend.", type: "fill-in-the-blank", correctAnswer: "plays", explanation: "He is third-person singular, so play becomes plays.", options: [] },
                { question: "Choose the correct verb form: She ....... TV every evening.", type: "multiple-choice", correctAnswer: "watches", explanation: "Watch ends in -ch, so add -es: watches.", options: ["watches", "watch", "watchs", ""] },
                { question: "Fill in the blank: They ....... (live) in Ho Chi Minh City.", type: "fill-in-the-blank", correctAnswer: "live", explanation: "With They, use the base verb.", options: [] },
                { question: "Choose the incorrect sentence:", type: "multiple-choice", correctAnswer: "They likes coffee.", explanation: "They uses the base verb: like.", options: ["I like coffee.", "He likes coffee.", "They likes coffee.", ""] },
                { question: "Fill in the blank: She ....... (study) English every day.", type: "fill-in-the-blank", correctAnswer: "studies", explanation: "Study ends in consonant + y, so y changes to ies.", options: [] },
                { question: "Choose the correct sentence with have:", type: "multiple-choice", correctAnswer: "He has a new phone.", explanation: "Have becomes has with He/She/It.", options: ["He have a new phone.", "He haves a new phone.", "He has a new phone.", ""] }
            ]
        }
    }
];

async function main() {
    const client = DatabaseConnection.getMongoClient();
    await client.connect();
    const db = client.db(config.mongodb.database);
    const collection = db.collection("englishtranslations");
    await collection.createIndex(
        { contentType: 1, contentId: 1 },
        { unique: true, name: "content_translation_unique" }
    );

    let upserted = 0;
    let modified = 0;
    for (const translation of translations) {
        const result = await collection.updateOne(
            {
                contentType: "grammar",
                contentId: new ObjectId(translation.contentId)
            },
            {
                $set: {
                    contentType: "grammar",
                    contentId: new ObjectId(translation.contentId),
                    sourceSlug: translation.sourceSlug,
                    fields: translation.fields,
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            { upsert: true }
        );
        upserted += result.upsertedCount || 0;
        modified += result.modifiedCount || 0;
    }

    console.log(`Seeded grammar English translations: ${translations.length} total (${upserted} inserted, ${modified} updated).`);
    await client.close();
}

main().catch(async (error) => {
    console.error("Failed to seed grammar English translations:", error);
    try {
        await DatabaseConnection.getMongoClient().close();
    } catch {}
    process.exit(1);
});
