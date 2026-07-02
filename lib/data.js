export const QUESTIONS = {
    'Java Developer': {
        'Beginner / Junior': [
            {
                text: "Explain the difference between JDK, JRE, and JVM.",
                idealAnswer: "JDK is the development kit needed to write and compile Java code. JRE is the runtime environment required to run Java applications. JVM is the virtual machine that actually executes the bytecode.",
                keywords: ["JDK", "JRE", "JVM", "development", "runtime", "bytecode", "virtual machine"]
            },
            {
                text: "What are the access modifiers available in Java?",
                idealAnswer: "Java has four access modifiers: public (accessible everywhere), private (only within class), protected (within package and subclasses), and default (within package).",
                keywords: ["public", "private", "protected", "default", "package", "subclass"]
            },
            {
                text: "Can you explain the concept of Method Overloading vs Method Overriding?",
                idealAnswer: "Method Overloading happens within the same class with different parameters. Method Overriding happens in a subclass where a method from the parent class is redefined with same signature.",
                keywords: ["Overloading", "Overriding", "same class", "subclass", "signature", "parameters", "inheritance"]
            },
            {
                text: "What is the 'static' keyword used for in Java?",
                idealAnswer: "The static keyword means the member belongs to the class itself rather than an instance. Static methods can be called without creating an object.",
                keywords: ["belongs to class", "instance", "memory", "object", "global"]
            },
            {
                text: "How does the 'finally' block work in exception handling?",
                idealAnswer: "The finally block always executes after try and catch, regardless of whether an exception was thrown. It is typically used for resource cleanup.",
                keywords: ["always executes", "cleanup", "resource", "try", "catch", "exception"]
            },
            {
                text: "What is an Interface in Java and how does it differ from an Abstract Class?",
                idealAnswer: "An interface is a blueprint that can only contain abstract methods and constants (pre-Java 8). An abstract class can have both abstract and concrete methods. A class can implement multiple interfaces but extend only one class.",
                keywords: ["interface", "abstract class", "multiple inheritance", "blueprint", "implements", "extends"]
            }
        ],
        'Intermediate / Associate': [
            {
                text: "How do 'HashMap' and 'ConcurrentHashMap' differ in internal implementation?",
                idealAnswer: "HashMap is not thread-safe and allows null keys. ConcurrentHashMap is thread-safe using bucket-level locking or segmentation (in later Java versions) and doesn't allow null keys.",
                keywords: ["thread-safe", "null keys", "locking", "segmentation", "concurrent", "synchronized"]
            },
            {
                text: "What is the difference between Comparable and Comparator interfaces?",
                idealAnswer: "Comparable is used for natural ordering (compareTo). Comparator is used for custom ordering (compare).",
                keywords: ["Comparable", "Comparator", "natural ordering", "custom ordering", "compareTo", "compare"]
            },
            {
                text: "Explain the internal working of Java Streams API.",
                idealAnswer: "Streams provide a functional way to process collections. They use intermediate operations (lazy) like filter/map and terminal operations (eager) like collect/forEach.",
                keywords: ["Streams", "lazy evaluation", "terminal operation", "intermediate operation", "functional", "filter", "map"]
            },
            {
                text: "What is Dependency Injection and how does Spring handle it?",
                idealAnswer: "DI is a design pattern where objects receive their dependencies from an external source. Spring uses an Inversion of Control (IoC) container to manage beans and inject them using @Autowired.",
                keywords: ["Dependency Injection", "IoC", "Spring", "Autowired", "beans", "decoupling"]
            },
            {
                text: "Describe the 'volatile' keyword in a multi-threaded context.",
                idealAnswer: "Volatile ensures that a variable's value is always read from and written to main memory, providing visibility across threads but not atomicity.",
                keywords: ["volatile", "visibility", "main memory", "threading", "concurrency", "happens-before"]
            }
        ],
        'Expert / Lead': [
            {
                text: "Explain Java Memory Model and specifically the 'happens-before' relationship.",
                idealAnswer: "The JMM defines how threads interact through memory. The happens-before relationship ensures that memory writes by one thread are visible to another thread.",
                keywords: ["JMM", "happens-before", "visibility", "threads", "memory", "atomicity"]
            },
            {
                text: "How would you optimize a high-throughput Java application experiencing frequent Garbage Collection pauses?",
                idealAnswer: "Optimization involves tuning GC parameters (like G1GC or ZGC), reducing object creation, using pooling, and profiling memory leaks.",
                keywords: ["Garbage Collection", "GC tuning", "G1GC", "ZGC", "object pooling", "memory leaks", "profiling"]
            },
            {
                text: "Describe the architecture of a high-availability microservices system using Spring Boot and Kafka.",
                idealAnswer: "A HA system involves redundant service instances, a load balancer, distributed configuration (Spring Cloud Config), and event-driven communication via Kafka to ensure eventual consistency.",
                keywords: ["Microservices", "Kafka", "high availability", "event-driven", "Spring Cloud", "load balancing"]
            },
            {
                text: "What are Java Modules (Project Jigsaw) and how do they improve large-scale applications?",
                idealAnswer: "Modules provide better encapsulation and reliable configuration by explicitly declaring dependencies and exported packages, leading to smaller runtimes and better security.",
                keywords: ["Jigsaw", "Modules", "encapsulation", "scalability", "module-info", "reliability"]
            },
            {
                text: "Explain the concept of 'Reactive Programming' in the Spring ecosystem (Project Reactor/WebFlux).",
                idealAnswer: "Reactive programming is a non-blocking, event-driven paradigm for handling asynchronous data streams with backpressure support, implemented via Mono and Flux in Spring.",
                keywords: ["Reactive", "WebFlux", "non-blocking", "Mono", "Flux", "backpressure", "asynchronous"]
            }
        ]
    },
    'Frontend Engineer': {
        'Beginner / Junior': [
            {
                text: "What is the difference between 'let', 'const', and 'var' in JavaScript?",
                idealAnswer: "var is function-scoped and hoisted. let and const are block-scoped. const prevents reassignment, while let allows it.",
                keywords: ["block-scope", "function-scope", "hoisting", "reassignment", "let", "const", "var"]
            },
            {
                text: "Explain the CSS Box Model.",
                idealAnswer: "The CSS box model consists of Margins, Borders, Padding, and the actual Content. It determines how the size and spacing of elements are calculated.",
                keywords: ["margin", "border", "padding", "content", "box-sizing", "width", "height"]
            },
            {
                text: "What are the common ways to center a div in CSS?",
                idealAnswer: "Common methods include using Flexbox (justify-content and align-items: center), Grid (place-items: center), or absolute positioning with transform: translate(-50%, -50%).",
                keywords: ["flexbox", "grid", "centering", "absolute", "transform", "justify-content"]
            },
            {
                text: "Describe the differences between '==' and '===' in JavaScript.",
                idealAnswer: "== is abstract equality that performs type coercion, while === is strict equality that compares both value and type without coercion.",
                keywords: ["coercion", "strict equality", "type", "value", "JavaScript"]
            },
            {
                text: "What is an event listener in JavaScript and how do you use it?",
                idealAnswer: "An event listener is a function that waits for a specific user interaction (like 'click'). You attach it using the addEventListener method on a DOM element.",
                keywords: ["addEventListener", "event", "click", "DOM", "callback", "listener"]
            }
        ],
        'Intermediate / Associate': [
            {
                text: "Explain the Virtual DOM and how React's reconciliation process works.",
                idealAnswer: "Virtual DOM is a lightweight copy of the real DOM. Reconciliation is the process where React compares the Virtual DOM with the real DOM and updates only the changed parts.",
                keywords: ["diffing", "reconciliation", "lightweight", "real DOM", "updates", "performance"]
            },
            {
                text: "What are React Hooks and why were they introduced?",
                idealAnswer: "Hooks allow using state and lifecycle features in functional components. They promote better code reuse and side-effect management.",
                keywords: ["Hooks", "useState", "useEffect", "functional components", "reusability", "state"]
            },
            {
                text: "How does the 'useMemo' hook differ from 'useCallback'?",
                idealAnswer: "useMemo returns a memoized value, while useCallback returns a memoized callback function. Both help in performance optimization by preventing unnecessary re-renders.",
                keywords: ["useMemo", "useCallback", "memoization", "performance", "re-render", "dependency"]
            },
            {
                text: "Describe the concept of 'Prop Drilling' and how to avoid it.",
                idealAnswer: "Prop drilling is passing data through multiple levels of components. It can be avoided using React Context API or state management libraries like Redux.",
                keywords: ["Prop Drilling", "Context API", "Redux", "state management", "composition"]
            },
            {
                text: "What are 'Closures' in JavaScript and provide a practical use case.",
                idealAnswer: "A closure is a function that remembers its lexical scope even when executed outside it. Practical uses include data privacy (private variables) and function factories.",
                keywords: ["Closure", "lexical scope", "privacy", "encapsulation", "JavaScript"]
            }
        ],
        'Expert / Lead': [
            {
                text: "How would you implement Server-Side Rendering (SSR) manually and what are the trade-offs compared to Client-Side Rendering (CSR)?",
                idealAnswer: "SSR creates the HTML on the server. Trade-offs include better SEO and initial load speed vs. server load and slower subsequent interactions.",
                keywords: ["SSR", "CSR", "SEO", "TTFB", "hydration", "next.js", "performance"]
            },
            {
                text: "Explain Micro-Frontends and when you would recommend this architecture.",
                idealAnswer: "Micro-Frontends split the frontend into small, independent pieces. It's recommended for large teams and codebases that need independent deployment and tech stacks.",
                keywords: ["Micro-Frontends", "independent deployment", "module federation", "scalability", "architecture"]
            },
            {
                text: "Describe 'Island Architecture' in the context of modern frontend frameworks like Astro.",
                idealAnswer: "Islands architecture delivers static HTML with small, isolated pockets of interactivity. It minimizes JS shipped to the client and improves Core Web Vitals.",
                keywords: ["Islands", "Astro", "hydration", "performance", "static HTML", "interactivity"]
            },
            {
                text: "How do you handle performance bottlenecks in a large React application?",
                idealAnswer: "Strategies include using Profiler API, implementing virtualization for lists, lazy loading components, and optimizing expensive computations with useMemo.",
                keywords: ["Profiler", "virtualization", "lazy loading", "performance", "bottlenecks", "React"]
            },
            {
                text: "What is 'Tree Shaking' and how does it affect your production bundle?",
                idealAnswer: "Tree shaking is the removal of dead code during the build process. It relies on ES6 module syntax and helps in reducing the final bundle size.",
                keywords: ["Tree Shaking", "dead code", "Webpack", "bundle size", "ES6 modules"]
            }
        ]
    },
    'Data Scientist': {
        'Beginner / Junior': [
            {
                text: "What is the difference between supervised and unsupervised learning?",
                idealAnswer: "Supervised learning uses labeled data to train models for prediction. Unsupervised learning finds patterns in unlabeled data without explicit targets.",
                keywords: ["labeled", "unlabeled", "targets", "patterns", "clustering", "regression"]
            }
        ],
        'Intermediate / Associate': [
            {
                text: "Explain the Bias-Variance tradeoff.",
                idealAnswer: "Bias is error from erroneous assumptions. Variance is error from sensitivity to small fluctuations. High bias leads to underfitting, high variance leads to overfitting.",
                keywords: ["overfitting", "underfitting", "generalization", "noise", "error"]
            }
        ],
        'Expert / Lead': [
            {
                text: "How do you handle class imbalance in a classification problem?",
                idealAnswer: "Techniques include oversampling (SMOTE), undersampling, using different evaluation metrics (F1-score, Precision-Recall), and cost-sensitive learning.",
                keywords: ["class imbalance", "SMOTE", "oversampling", "undersampling", "F1-score", "precision-recall", "cost-sensitive"]
            }
        ]
    },
    'Full Stack Developer': {
        'Beginner / Junior': [
            {
                text: "What is REST and how does it differ from GraphQL?",
                idealAnswer: "REST is an architectural style using standard HTTP methods. GraphQL is a query language that allows clients to request specific data in a single request.",
                keywords: ["REST", "GraphQL", "endpoints", "query", "over-fetching", "under-fetching"]
            }
        ],
        'Intermediate / Associate': [
            {
                text: "How do you secure a REST API?",
                idealAnswer: "Securing APIs involves authentication (OAuth2, JWT), authorization, HTTPS/TLS, rate limiting, and input validation.",
                keywords: ["OAuth2", "JWT", "HTTPS", "TLS", "rate limiting", "input validation", "authorization"]
            }
        ],
        'Expert / Lead': [
            {
                text: "Explain Event-Driven Architecture and its benefits in a distributed system.",
                idealAnswer: "EDA uses events for communication between services. Benefits include loose coupling, scalability, and asynchronous processing.",
                keywords: ["EDA", "events", "pub/sub", "Kafka", "RabbitMQ", "loose coupling", "scalability"]
            }
        ]
    },
    'Software Architect': {
        'Beginner / Junior': [
            {
                text: "What are Microservices and when should they be preferred over Monoliths?",
                idealAnswer: "Microservices are small, independent services. They should be preferred for large-scale, complex systems where scalability and independent deployment are critical.",
                keywords: ["scalability", "decoupled", "deployment", "monolith", "complexity"]
            }
        ],
        'Intermediate / Associate': [
            {
                text: "Explain the CAP theorem and its implications.",
                idealAnswer: "The CAP theorem states that a distributed system can only provide two out of three guarantees: Consistency, Availability, and Partition Tolerance.",
                keywords: ["CAP theorem", "consistency", "availability", "partition tolerance", "distributed systems"]
            }
        ],
        'Expert / Lead': [
            {
                text: "What are the common strategies for database sharding and scaling?",
                idealAnswer: "Strategies include horizontal partitioning (sharding), vertical partitioning, replication (read-replicas), and caching.",
                keywords: ["sharding", "horizontal partitioning", "vertical partitioning", "replication", "read-replicas", "caching", "scaling"]
            }
        ]
    },
    'Product Manager': {
        'Beginner / Junior': [
            {
                text: "How do you prioritize features for a new product roadmap?",
                idealAnswer: "I use frameworks like RICE or MoSCoW, balancing user impact, technical effort, and strategic alignment with business goals.",
                keywords: ["RICE", "MoSCoW", "user impact", "priority", "strategic alignment", "roadmap"]
            }
        ],
        'Intermediate / Associate': [
            {
                text: "How do you measure the success of a newly launched feature?",
                idealAnswer: "Success is measured using KPIs like adoption rate, user engagement, retention, and feedback from user research.",
                keywords: ["KPIs", "adoption rate", "user engagement", "retention", "metrics", "A/B testing"]
            }
        ],
        'Expert / Lead': [
            {
                text: "How do you handle a product pivot and communicate it to stakeholders?",
                idealAnswer: "A pivot involves re-evaluating market fit and strategic goals. Communication involves transparent rationale, impact analysis, and a revised roadmap.",
                keywords: ["pivot", "market fit", "stakeholders", "strategic planning", "roadmap", "impact analysis"]
            }
        ]

    }
};

// Fallback questions for other domains
export const DEFAULT_QUESTIONS = [
    "Tell me about a challenging technical project you worked on.",
    "How do you stay up-to-date with new technologies and industry trends?",
    "Explain a concept you learned recently in under two minutes.",
    "How do you approach debugging a complex problem?",
    "What is your preferred development workflow?"
];
