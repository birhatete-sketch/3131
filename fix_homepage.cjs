const fs = require('fs');
const file = 'src/pages/HomePage.jsx';
let content = fs.readFileSync(file, 'utf-8');

// Fix 1: restore the broken announcement popup closing (lines 140-142 area)
// The popup currently ends with:  Anladım\n </button>\n )}\n  which is broken
// Should be: Anladım\n</button>\n</div>\n</div>\n</div>\n)}\n
content = content.replace(
`                                Anladım
                            </button>
                             )}
            {/* ═══════ HERO SECTION ═══════ */}`,
`                                Anladım
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ═══════ HERO SECTION ═══════ */}`
);

// Fix 2: remove the orphan closing tags after the IIFE })()}
content = content.replace(
`            })()}

                        </div>
                    )}
                </section>
            )}`,
`            })()}`
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Done. Lines:', content.split('\n').length);
